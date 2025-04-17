
# Express GenAI API - Tài liệu kỹ thuật

## 1. Kiến trúc tổng quan

API Platform này được xây dựng trên nền tảng Node.js/Express, cung cấp các dịch vụ AI bao gồm:
- Google Generative AI (text generation, conversation context)
- Phân tích dựa trên nội dung file
- Text-to-Speech (TTS) v1 & v2
- Tích hợp clustering, caching

### Kiến trúc hệ thống

```
┌─────────────┐      ┌─────────────┐      ┌───────────────┐
│ API Gateway │ ──▶ │ Service Layer│ ──▶ │ Data Layer    │
│ (Express)   │ ◀── │ (Business    │ ◀── │ (MySQL/ORM)   │
└─────────────┘      │  Logic)      │      └───────────────┘
                     └─────────────┘
                           │ ▲
                           ▼ │
                     ┌─────────────┐      ┌───────────────┐
                     │ Caching     │ ──▶ │ File Storage  │
                     │ Layer       │ ◀── │ (Local/Cloud) │
                     └─────────────┘      └───────────────┘
                           │ ▲
                           ▼ │
                     ┌─────────────┐
                     │ Clustering  │
                     │ & Scaling   │
                     └─────────────┘
```

## 2. Các module chính

### API Routing & Middleware
- **Express**: Cung cấp các API endpoint
- **Middleware**: Xử lý lỗi, CORS, JSON parsing
- **Validation**: Kiểm tra tham số TTS, context, v.v.

```javascript
// Ví dụ routes (main.routes.js)
router.get('/test-workflow', (req, res) => res.send('Hello, changed!'));
// Middleware validation và xử lý lỗi
const { validateTTSParams, validateTTSV2Params } = require('../middlewares/main.middlewares');
```

### Text-Generation & Conversation Context
- Tích hợp Google Generative AI để tạo text
- Lưu trữ và quản lý context của cuộc trò chuyện
- Hỗ trợ caching kết quả để tối ưu hiệu suất

```javascript
// Ví dụ từ gen.services.js
const tryGenerateWithKey = async (apiKey, modelAI, prompt, contextID, req) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelAI });
    
    // Lấy context trò chuyện
    const contextRecords = await db.ChatMessages.findAll({
        where: { contextId: contextID },
        order: [['index', 'ASC']],
        transaction
    });
    
    // Gọi API với context
    const result = context
        ? await model.startChat(context).sendMessage(prompt)
        : await model.startChat(...).sendMessage(prompt);
    
    // Lưu lại lịch sử trò chuyện
    await db.ChatMessages.bulkCreate([
        { contextId: contextID, content: prompt, role: 'user', ... },
        { contextId: contextID, content: result.response.text(), role: 'model', ... }
    ], { transaction });
    
    return { text: result.response.text(), timestamp: createAt };
};
```

### File-Based Content Analysis
- Quản lý upload file
- Phân tích nội dung file bằng Google Generative AI
- Lưu trữ kết quả phân tích

```javascript
// Ví dụ từ gen.services.js
const fileRecords = await db.Files.findAll({
    where: { contextId: contextID },
    transaction
});

const fileHistorys = await Promise.all(fileRecords.map(async (fileRecord) => {
    const fileName = path.basename(fileRecord.filePath);
    const response = await fileManager.uploadFile(path.join(__dirname, '../uploads/', fileRecord.filePath), {
        mimeType: fileRecord.fileMimeType,
        displayName: fileName
    });
    
    return {
        role: "user",
        parts: [{ text: `File ${fileName}` }, {
            fileData: {
                mimeType: response.file.mimeType,
                fileUri: response.file.uri,
            },
        }],
    };
}));
```

### Text-to-Speech (TTS) v1 & v2
- Hai phiên bản TTS tích hợp
- Xử lý văn bản, chuyển đổi thành audio
- Lưu trữ tệp âm thanh và cung cấp URL

```javascript
// Ví dụ từ tts.controllers.js
exports.genSpeech = async (req, res) => {
    try {
        const { text, voiceId, speed, model } = req.body;
        const result = await ttsService.ttsIntelligent(text, voiceId, speed, model);
        res.status(200).json({
            success: true,
            message: 'Speech generated successfully',
            media_url: result.url,
            timestamp: result.timestamp,
            error: null
        });
    } catch (error) { ... }
};

// Dịch vụ TTS v2
exports.genSpeechV2 = async (req, res) => {
    try {
        const { text, voiceId, speed, language } = req.body;
        const result = await ttsServicev2.ttsIntelligent(text, voiceId, speed, language);
        // xử lý kết quả...
    } catch (error) { ... }
};
```

### Data Layer
- Sử dụng Sequelize ORM để tương tác với MySQL
- Các entity: ChatMessages, Files, SpeechRecords, v.v.
- Sử dụng transactions để đảm bảo tính toàn vẹn dữ liệu

```javascript
// Ví dụ từ tts.services.js
const transaction = await db.sequelize.transaction();
try {
    await db.SpeechRecords.create({ 
        recordName: fileName, 
        serverUrl: url, 
        createdAt: createAt, 
        updatedAt: createAt 
    }, { transaction });
    await transaction.commit();
} catch (error) {
    await transaction.rollback();
    throw new Error("Failed to save speech record from server");
}
```

### Caching Layer
- Sử dụng bộ nhớ cache cho response
- Cải thiện hiệu suất bằng cách lưu trữ kết quả text generation

```javascript
// Ví dụ từ gen.services.js
const genService = {
    getAIGenerateWithContext: async (prompt, contextID, modelAI, req) => {
        const cacheKey = `${contextID}_${prompt}_${modelAI}`;
        const cachedResponse = await responseCacheService.get(cacheKey);
        
        if (cachedResponse) {
            return cachedResponse;
        }
        
        const response = await tryWithMultipleKeys(prompt, modelAI, contextID, req);
        
        await responseCacheService.set(cacheKey, response);
        
        return response;
    }
};
```

### Clustering & Scaling
- Hỗ trợ clustering để mở rộng ứng dụng
- IPC (Inter-Process Communication) để chia sẻ state giữa các worker

```javascript
// Ví dụ từ shared-state.services.js
function initializeSharedServices() {
    const pendingCallbacks = new Map();
    let messageIdCounter = 0;
    
    process.on('message', (message) => {
        const callback = pendingCallbacks.get(message.id);
        if (callback) {
            callback(message);
            pendingCallbacks.delete(message.id);
        }
    });
    
    function sendMessageToMaster(type, data) {
        return new Promise((resolve) => {
            const id = messageIdCounter++;
            pendingCallbacks.set(id, (response) => {
                resolve(response);
            });
            
            process.send({
                type,
                id,
                ...data
            });
        });
    }
    
    // Các dịch vụ khóa context và cache...
}
```

### File Storage
- Lưu trữ file âm thanh TTS cục bộ
- Tạo thư mục nếu cần thiết
- Truy cập file thông qua URL

```javascript
// Ví dụ từ tts.services.js
const saveBufferToFile = async (buffer, text, voiceId) => {
    const hash = crypto.createHash('md5')
        .update(text + voiceId + Date.now())
        .digest('hex');
    const fileName = `tts-${hash}.mp3`;

    const filePath = path.join(__dirname, '../public/tts-audio', fileName);

    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    await fs.promises.writeFile(filePath, buffer);

    return fileName;
}
```

## 3. Cấu trúc thư mục

```
├─ controllers/       # Chứa các controller xử lý request
│  ├─ aigen.controllers.js  # Xử lý text generation
│  ├─ context.controller.js # Quản lý context cuộc hội thoại
│  ├─ tts.controllers.js    # Xử lý TTS
│  └─ upload.controllers.js # Xử lý upload file
├─ models/
│  └─ db.models.js    # Định nghĩa các model DB sử dụng Sequelize
├─ services/          # Business logic chính
│  ├─ gen.services.js        # Google Generative AI
│  ├─ shared-state.services.js # Chia sẻ state giữa các worker
│  ├─ tts.services.js        # Dịch vụ TTS v1
│  └─ ttsv2.services.js      # Dịch vụ TTS v2 nâng cao
├─ middlewares/
│  └─ main.middlewares.js    # Xử lý lỗi, parsing, validation
├─ routes/
│  └─ main.routes.js         # Định nghĩa các API endpoint
├─ public/            # Thư mục lưu file static
│  └─ tts-audio/      # Thư mục lưu file âm thanh TTS
├─ uploads/           # Thư mục tạm lưu file upload
├─ cluster/           # Mã nguồn liên quan đến clustering
├─ hosting.js         # Khởi tạo Express app và các middleware
└─ .env               # Biến môi trường
```

## 4. Luồng request ví dụ

### Text Generation

1. Client gửi request POST đến API endpoint với prompt và contextId
2. Middleware xác thực và validate request
3. Controller xử lý request, chuyển cho service layer
4. Service kiểm tra cache trước, nếu có thì trả về kết quả
5. Nếu không, service gọi Google Generative AI API
6. Kết quả được lưu vào database và cache
7. Response được trả về cho client

### Text-to-Speech

1. Client gửi request POST với text, voiceId, speed và model
2. Middleware validate tham số
3. Controller chuyển request đến ttsService hoặc ttsServicev2
4. Service chia nhỏ text nếu cần thiết
5. Gọi API TTS để chuyển đổi từng phần
6. Kết hợp các phần và lưu file âm thanh
7. Lưu record vào database và trả URL cho client

## 5. Chú ý về hiệu năng & bảo mật

- **Caching**: Sử dụng caching để giảm số lượng request đến Google API
- **Transactions**: Đảm bảo tính toàn vẹn dữ liệu bằng transactions
- **Clustering**: Mở rộng ứng dụng bằng cách sử dụng nhiều worker
- **Context locking**: Tránh race condition khi nhiều worker cùng truy cập context
- **Error handling**: Xử lý các lỗi từ API bên ngoài và rollback transaction nếu cần
- **Timeout handling**: Quản lý timeout trong các request dài

---

Tài liệu này mô tả tổng quan về API Platform AI được xây dựng trên Node.js/Express, với các dịch vụ Google Generative AI, Text-to-Speech, và xử lý file. Các tính năng chính bao gồm quản lý context, caching, clustering và lưu trữ file.
