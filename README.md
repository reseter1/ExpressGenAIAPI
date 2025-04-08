# Generative AI API

Dự án này cung cấp một máy chủ API để tương tác với các mô hình AI tạo sinh của Google (Google Generative AI), hỗ trợ tạo văn bản và chuyển đổi văn bản thành giọng nói (TTS).

## Tổng quan

Hệ thống API Generative AI là một máy chủ Express.js được xây dựng để cung cấp khả năng tương tác với các mô hình AI tạo sinh thông qua các API RESTful. Hệ thống hỗ trợ:

- Tạo văn bản từ AI dựa trên prompt
- Tải lên tệp để phân tích
- Tạo giọng nói từ văn bản (Text-to-Speech)
- Duy trì ngữ cảnh hội thoại qua nhiều lượt tương tác
- Xử lý đồng thời nhiều yêu cầu với hệ thống phân cụm (cluster)

## Tài liệu

Tham khảo tài liệu đầy đủ tại [đây](https://genai-reseter.apidog.io/).

## Cấu trúc dự án

```
├── app.js                  # Điểm khởi đầu ứng dụng
├── cluster/                # Cấu hình xử lý đa tiến trình
├── config/                 # Cấu hình ứng dụng
├── constants/              # Các hằng số
├── controllers/            # Xử lý logic từ các route
├── helpers/                # Các hàm tiện ích
├── labs/                   # Các tính năng thử nghiệm
├── middlewares/            # Middleware Express
├── migrations/             # Migrations cơ sở dữ liệu
├── models/                 # Mô hình Sequelize
├── routes/                 # Định nghĩa các route
├── scripts/                # Script hỗ trợ
├── server/                 # Cấu hình máy chủ
├── services/               # Các dịch vụ nghiệp vụ
├── .env.example            # Mẫu biến môi trường
├── .gitignore              # Danh sách tệp bỏ qua Git
├── .sequelizerc            # Cấu hình Sequelize
├── docker-compose.yml      # Cấu hình Docker
├── package.json            # Thông tin dự án và dependencies
└── package-lock.json       # Khóa phiên bản dependencies
```

## Các tính năng

### AI Text Generation

- Endpoint: `/api/v2/ai-gen`
- Cho phép gửi prompt và nhận phản hồi từ mô hình AI
- Hỗ trợ duy trì ngữ cảnh hội thoại qua nhiều lượt tương tác
- Đồng bộ hóa và khóa ngữ cảnh để tránh xung đột

### Tải lên tệp

- Endpoint: `/api/v2/upload-file`
- Cho phép tải lên tệp để phân tích với AI
- Hỗ trợ nhiều loại tệp khác nhau

### Text-to-Speech

- Endpoint: `/api/v2/ttsv1-gen`
- Chuyển đổi văn bản thành giọng nói
- Hỗ trợ đa ngôn ngữ nhưng có thể thường xuyên lỗi và không up time 100%

- Endpoint: `/api/v2/ttsv2-gen`
- Chuyển đổi văn bản thành giọng nói
- Hỗ trợ ngôn ngữ Việt Nam và Anh Ngữ và đảm bảo up time 100%

## Yêu cầu hệ thống

- Node.js (phiên bản 20.x trở lên)
- MariaDB hoặc MySQL
- Docker (tùy chọn)

## API Endpoints

| Endpoint | Phương thức | Mô tả |
|----------|----------|----------|
| `/helloworld` | GET | Kiểm tra máy chủ hoạt động |
| `/api/v2/ai-gen` | POST | Tạo văn bản từ AI với prompt |
| `/api/v2/upload-file` | POST | Tải lên tệp để phân tích với AI |
| `/api/v2/ttsv1-gen` | POST | Chuyển đổi văn bản thành giọng nói (phiên bản 1 - hỗ trợ đa ngôn ngữ nhưng có thể thường xuyên lỗi và không up time 100%) |
| `/api/v2/ttsv2-gen` | POST | Chuyển đổi văn bản thành giọng nói (phiên bản 2 - chỉ hỗ trợ ngôn ngữ Việt Nam và Anh Ngữ và đảm bảo up time 100%) |

### Yêu cầu API:

#### Tạo văn bản từ AI:
```json
{
    "prompt": "Văn bản prompt của bạn",
    "model": "flash hoặc pro",
    "contextId": "ID ngữ cảnh (tùy chọn)"
}
```

#### Phản hồi:
```json
{
    "success": true,
    "message": "Success",
    "text": "Phản hồi từ AI",
    "timestamp": "2023-06-30 12:34:56",
    "contextId": "ID ngữ cảnh",
    "error": null
}
```

## Xử lý đa tiến trình

Dự án sử dụng module `cluster` của Node.js để tận dụng tối đa nguồn lực CPU bằng cách tạo nhiều tiến trình worker. Điều này giúp nâng cao hiệu suất khi xử lý nhiều yêu cầu đồng thời.

## Lưu trữ và bộ nhớ đệm

- Hệ thống sử dụng Sequelize ORM để tương tác với cơ sở dữ liệu MariaDB/MySQL
- Bộ nhớ đệm được triển khai để lưu trữ phản hồi của AI, giảm thiểu việc gọi API lặp lại
- Quản lý ngữ cảnh hội thoại thông qua cơ sở dữ liệu

## Xử lý lỗi và thử lại

Hệ thống được thiết kế để:
- Xử lý các trường hợp quá thời gian (timeout)
- Thử lại với nhiều API key khác nhau nếu một key gặp lỗi
- Khóa và giải phóng ngữ cảnh để tránh xung đột
