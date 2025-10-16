"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const database_1 = require("../config/database");
const router = express_1.default.Router();
// GET /health - Health check endpoint
router.get('/health', async (req, res) => {
    try {
        // Check database connection
        const result = await (0, database_1.query)('SELECT 1 as test');
        res.json({
            success: true,
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'connected',
                api: 'running'
            }
        });
    }
    catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                database: 'disconnected',
                api: 'running'
            },
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
exports.default = router;
//# sourceMappingURL=health.js.map