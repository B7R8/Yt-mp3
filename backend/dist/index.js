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
const conversion_1 = __importDefault(require("./routes/conversion"));
const health_1 = __importDefault(require("./routes/health"));
const admin_1 = __importDefault(require("./routes/admin"));
const secureWallet_1 = __importDefault(require("./routes/secureWallet"));
const conversionService_1 = require("./services/conversionService");
const logger_1 = __importDefault(require("./config/logger"));
const database_1 = require("./config/database");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Security middleware
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS configuration - More permissive for debugging
app.use((0, cors_1.default)({
    origin: true, // Allow all origins for debugging
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Streaming-Request']
}));
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
app.use('/api', conversion_1.default);
app.use('/api/secure-wallet', secureWallet_1.default);
app.use('/api', admin_1.default);
// Debug: Log all registered routes
console.log('Routes registered: health, conversion, admin');
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
        await (0, database_1.initializeDatabase)();
        // Start cleanup cron job
        const conversionService = new conversionService_1.ConversionService();
        node_cron_1.default.schedule('0 */1 * * *', () => {
            logger_1.default.info('Running cleanup job...');
            conversionService.cleanupOldFiles().catch(error => {
                logger_1.default.error('Cleanup job failed:', error);
            });
        });
        // Start server
        app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT}`);
            logger_1.default.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
            logger_1.default.info('Using SQLite database for development');
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