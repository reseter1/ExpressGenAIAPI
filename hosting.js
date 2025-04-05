const express = require('express');
const cors = require('cors');
const timeout = require('connect-timeout');
const path = require('path');
const db = require('./models/db.models');
const mainRoutes = require('./routes/main.routes');
const { errorHandlingMiddleware, expressJsonMiddleware } = require('./middlewares/main.middlewares');

const PORT = 6789;

// Mock cho các shared services
function setupSharedServices() {
    // Mock cho contextLockService
    global.contextLockService = {
        acquireLock: async (contextId) => {
            return true; // Luôn trả về thành công vì không có các worker cạnh tranh
        },

        releaseLock: async (contextId) => {
            return true;
        },

        isLocked: async (contextId) => {
            return false; // Không có lock trong môi trường đơn luồng
        }
    };

    // Mock cho responseCacheService
    const cacheStore = new Map();
    global.responseCacheService = {
        get: async (key) => {
            return cacheStore.get(key);
        },

        set: async (key, value, ttl = 300) => {
            if (ttl) {
                setTimeout(() => {
                    cacheStore.delete(key);
                }, ttl * 1000);
            }
            cacheStore.set(key, value);
            return true;
        }
    };
}

function createServer() {
    const app = express();

    app.use(timeout('180s'));
    app.use(cors());
    expressJsonMiddleware(app);
    app.use('/files', express.static(path.join(__dirname, 'public')));
    app.use('/', mainRoutes);
    errorHandlingMiddleware(app);

    return app;
}

async function startServer() {
    // Thiết lập shared services trước khi khởi động server
    setupSharedServices();

    const app = createServer();

    try {
        await db.sequelize.authenticate();
        app.listen(PORT, () => {
            console.log('Connected to the database successfully.');
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
}

// Khởi chạy server ngay lập tức
startServer();
