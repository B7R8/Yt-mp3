"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateJobId = exports.validateConversionRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const conversionSchema = joi_1.default.object({
    url: joi_1.default.string()
        .uri()
        .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)
        .required()
        .messages({
        'string.pattern.base': 'Please provide a valid YouTube URL',
        'any.required': 'YouTube URL is required'
    }),
    quality: joi_1.default.string()
        .valid('64k', '128k', '192k', '256k', '320k')
        .optional()
        .default('192k'),
    trim_start: joi_1.default.string()
        .pattern(/^\d{2}:\d{2}:\d{2}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Trim start must be in HH:MM:SS format'
    }),
    trim_end: joi_1.default.string()
        .pattern(/^\d{2}:\d{2}:\d{2}$/)
        .optional()
        .messages({
        'string.pattern.base': 'Trim end must be in HH:MM:SS format'
    })
});
const validateConversionRequest = (req, res, next) => {
    const { error, value } = conversionSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: error.details[0].message,
            field: error.details[0].path[0]
        });
    }
    req.body = value;
    next();
};
exports.validateConversionRequest = validateConversionRequest;
const validateJobId = (req, res, next) => {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
        return res.status(400).json({
            success: false,
            message: 'Valid job ID is required'
        });
    }
    next();
};
exports.validateJobId = validateJobId;
//# sourceMappingURL=validation.js.map