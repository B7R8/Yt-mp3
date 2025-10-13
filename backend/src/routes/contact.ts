import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import logger from '../config/logger';
import { getUserFriendlyError, logTechnicalError, sendErrorResponse } from '../utils/errorHandler';
import { statusRateLimit } from '../middleware/rateLimiter';

const router = express.Router();

// Email validation middleware
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('subject')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Subject must be between 1 and 200 characters'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
];

// Create email transporter
const createTransporter = () => {
  // Priority order: SendGrid > Mailgun > Gmail > Custom SMTP
  
  // Option 1: SendGrid (Recommended - No password needed!)
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      service: 'SendGrid',
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Option 2: Mailgun (No password needed!)
  if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
    return nodemailer.createTransport({
      service: 'Mailgun',
      auth: {
        user: 'api',
        pass: process.env.MAILGUN_API_KEY
      }
    });
  }
  
  // Option 3: Gmail SMTP (Requires app password)
  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  }
  
  // Option 4: Custom SMTP
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  
  // Fallback: Log error and return null
  logger.error('No email configuration found. Please set up SendGrid, Mailgun, Gmail, or SMTP credentials.');
  return null;
};

// POST /api/contact - Send contact form email
router.post('/contact', statusRateLimit, contactValidation, async (req: Request, res: Response) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, subject, message } = req.body;

    // Additional email validation to prevent fake emails
    const fakeEmailPatterns = [
      /^test@/i,
      /^fake@/i,
      /^dummy@/i,
      /^example@/i,
      /@test\./i,
      /@fake\./i,
      /@dummy\./i,
      /@example\./i,
      /@localhost/i,
      /@invalid/i,
      /@nonexistent/i,
      /@temp\./i,
      /@temporary\./i
    ];

    if (fakeEmailPatterns.some(pattern => pattern.test(email))) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a real email address'
      });
    }

    // Check for disposable email domains
    const disposableDomains = [
      '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com',
      'temp-mail.org', 'throwaway.email', 'getnada.com', 'maildrop.cc',
      'yopmail.com', 'mailnesia.com', 'sharklasers.com', 'guerrillamailblock.com'
    ];

    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain && disposableDomains.includes(emailDomain)) {
      return res.status(400).json({
        success: false,
        message: 'Please use a permanent email address, not a temporary one'
      });
    }

    // Create email transporter
    const transporter = createTransporter();
    
    if (!transporter) {
      return res.status(500).json({
        success: false,
        message: 'Email service not configured. Please contact the administrator.'
      });
    }

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@saveytb.com',
      to: 'contact@saveytb.com',
      replyTo: email,
      subject: `[SaveYTB Contact] ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #dc2626;">New Contact Form Submission</h2>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Contact Details</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="color: #374151; margin-top: 0;">Message</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 4px;">
            <p style="margin: 0; color: #991b1b; font-size: 14px;">
              <strong>Note:</strong> This message was sent from the SaveYTB contact form. 
              You can reply directly to this email to respond to ${name}.
            </p>
          </div>
        </div>
      `,
      text: `
New Contact Form Submission

Contact Details:
- Name: ${name}
- Email: ${email}
- Subject: ${subject}
- Date: ${new Date().toLocaleString()}

Message:
${message}

---
This message was sent from the SaveYTB contact form.
You can reply directly to this email to respond to ${name}.
      `
    };

    // Send email
    await transporter.sendMail(mailOptions);

    logger.info(`Contact form submitted successfully from ${email} (${name})`);

    res.json({
      success: true,
      message: 'Your message has been sent successfully. We will get back to you within 24 hours.'
    });

  } catch (error) {
    logger.error('Contact form submission failed:', error);
    
    const userMessage = getUserFriendlyError(error);
    logTechnicalError(error, 'Contact Form Submission', req);
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later or contact us directly at contact@saveytb.com'
    });
  }
});

export default router;
