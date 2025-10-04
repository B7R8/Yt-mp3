import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const conversionSchema = Joi.object({
  url: Joi.string()
    .uri()
    .pattern(/^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid YouTube URL',
      'any.required': 'YouTube URL is required'
    }),
  quality: Joi.string()
    .valid('64k', '128k', '192k', '256k', '320k')
    .optional()
    .default('192k'),
  trim_start: Joi.string()
    .pattern(/^\d{2}:\d{2}:\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Trim start must be in HH:MM:SS format'
    }),
  trim_end: Joi.string()
    .pattern(/^\d{2}:\d{2}:\d{2}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Trim end must be in HH:MM:SS format'
    })
});

export const validateConversionRequest = (req: Request, res: Response, next: NextFunction) => {
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

export const validateJobId = (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  
  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Valid job ID is required'
    });
  }

  next();
};
