"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCleanup = runCleanup;
const conversionService_1 = require("../services/conversionService");
const logger_1 = __importDefault(require("../config/logger"));
async function runCleanup() {
    try {
        logger_1.default.info('Starting manual cleanup...');
        const conversionService = new conversionService_1.ConversionService();
        await conversionService.cleanupOldFiles();
        logger_1.default.info('Manual cleanup completed');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Manual cleanup failed:', error);
        process.exit(1);
    }
}
// Run cleanup if this file is executed directly
if (require.main === module) {
    runCleanup();
}
//# sourceMappingURL=cleanup.js.map