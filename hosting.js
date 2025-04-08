const express = require('express');
const cors = require('cors');
const timeout = require('connect-timeout');
const path = require('path');
const db = require('./models/db.models');
const mainRoutes = require('./routes/main.routes');
const { errorHandlingMiddleware, expressJsonMiddleware } = require('./middlewares/main.middlewares');
const { initializeSharedServices } = require('./services/non-cluster-shared-state.services');
require('dotenv').config();
const PORT = 6789;

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
    const app = createServer();
    initializeSharedServices();

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

startServer();
