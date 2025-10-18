"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_cron_1 = __importDefault(require("node-cron"));
const simpleConversion_1 = __importDefault(require("./routes/simpleConversion"));
const health_1 = __importDefault(require("./routes/health"));
const secureWallet_1 = __importDefault(require("./routes/secureWallet"));
const contact_1 = __importDefault(require("./routes/contact"));
const processAudio_1 = __importDefault(require("./routes/processAudio"));
const simpleConversionService_1 = require("./services/simpleConversionService");
const processAudio_2 = require("./controllers/processAudio");
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3001', 10);
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://saveytb.com' : true),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Streaming-Request']
};
app.use((0, cors_1.default)(corsOptions));
// Body parsing middleware with UTF-8 support
app.use(express_1.default.json({
    limit: '10mb',
    type: 'application/json'
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: '10mb'
}));
// Set default charset for all responses
app.use((req, res, next) => {
    res.charset = 'utf-8';
    next();
});
// Request logging
app.use((req, res, next) => {
    logger_1.default.info(`${req.method} ${req.path} - ${req.ip}`);
    next();
});
// Routes
app.use('/api', health_1.default);
app.use('/api', simpleConversion_1.default);
app.use('/api', contact_1.default);
app.use('/api', processAudio_1.default);
app.use('/api/secure-wallet', secureWallet_1.default);
// Debug: Log all registered routes
console.log('Routes registered: health, conversion, contact, processAudio');
// Error handling middleware
app.use((error, req, res, next) => {
    const { getUserFriendlyError, logTechnicalError } = require('./utils/errorHandler');
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Express Error', req);
    res.status(500).json({
        success: false,
        message: userMessage
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});
// Initialize database and start server
async function startServer() {
    try {
        logger_1.default.info('Starting server initialization...');
        logger_1.default.info(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, DB_HOST=${process.env.DB_HOST}, PORT=${process.env.PORT}`);
        await (0, database_1.initializeDatabase)();
        logger_1.default.info('Database initialized successfully');
        // Start cleanup cron job (every 10 minutes to clean files older than 20 minutes)
        const conversionService = new simpleConversionService_1.SimpleConversionService();
        node_cron_1.default.schedule('*/10 * * * *', () => {
            logger_1.default.info('Running cleanup job for files older than 20 minutes...');
            conversionService.cleanupOldFiles().catch(error => {
                logger_1.default.error('Cleanup job failed:', error);
            });
        });
        logger_1.default.info('Cleanup cron job scheduled (every 10 minutes)');
        // Start audio processing cleanup cron job (every 5 minutes)
        node_cron_1.default.schedule('*/5 * * * *', () => {
            logger_1.default.info('Running audio processing cleanup job...');
            (0, processAudio_2.cleanupExpiredJobs)().catch(error => {
                logger_1.default.error('Audio processing cleanup job failed:', error);
            });
        });
        logger_1.default.info('Audio processing cleanup cron job scheduled (every 5 minutes)');
        // Start server
        const server = app.listen(PORT, '0.0.0.0', () => {
            logger_1.default.info(`✅ Server running on port ${PORT}`);
            logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            // Use the same logic as database.ts to determine database type
            const useSQLite = process.env.NODE_ENV !== 'production' && !process.env.DB_HOST;
            logger_1.default.info(`Database: ${useSQLite ? 'SQLite' : 'PostgreSQL'}`);
            logger_1.default.info(`Cache: In-memory cache enabled`);
            logger_1.default.info('🚀 Backend is ready to accept connections!');
        });
        // Handle server errors
        server.on('error', (error) => {
            logger_1.default.error('Server error:', error);
            if (error.code === 'EADDRINUSE') {
                logger_1.default.error(`Port ${PORT} is already in use`);
            }
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server:', error);
        process.exit(1);
    }
}
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map