# Email Setup Guide for SaveYTB Contact Form

This guide explains how to set up email functionality for the contact form to send emails to `contact@saveytb.com`.

## 📧 Email Configuration Options

### Option 1: Gmail SMTP (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
3. **Add to your `.env` file**:
   ```env
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   EMAIL_FROM=noreply@saveytb.com
   ```

### Option 2: Custom SMTP Server

```env
SMTP_HOST=smtp.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
EMAIL_FROM=noreply@saveytb.com
```

### Option 3: SendGrid (Recommended for Production)

1. **Sign up** at [SendGrid](https://sendgrid.com/)
2. **Create an API Key** with Mail Send permissions
3. **Add to your `.env` file**:
   ```env
   SENDGRID_API_KEY=your-sendgrid-api-key
   EMAIL_FROM=noreply@saveytb.com
   ```

### Option 4: Mailgun

1. **Sign up** at [Mailgun](https://www.mailgun.com/)
2. **Get your API key** from the dashboard
3. **Add to your `.env` file**:
   ```env
   MAILGUN_API_KEY=your-mailgun-api-key
   MAILGUN_DOMAIN=your-mailgun-domain
   EMAIL_FROM=noreply@saveytb.com
   ```

## 🚀 Installation Steps

### 1. Install Dependencies

```bash
cd backend
npm install nodemailer express-validator @types/nodemailer
```

### 2. Configure Environment Variables

Create or update your `backend/.env` file with the email configuration:

```env
# Email Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@saveytb.com

# Or for SendGrid
# SENDGRID_API_KEY=your-sendgrid-api-key
# EMAIL_FROM=noreply@saveytb.com
```

### 3. Update Email Service Configuration

The contact route (`backend/src/routes/contact.ts`) is already configured to work with multiple email providers. You just need to uncomment the appropriate section:

**For Gmail/SMTP:**
```typescript
return nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});
```

**For SendGrid:**
```typescript
return nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

## 🧪 Testing the Email Functionality

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

### 2. Test the Contact Form

1. Go to your frontend (http://localhost:5173)
2. Navigate to the Contact page
3. Fill out the form with a real email address
4. Submit the form
5. Check your email inbox for the message

### 3. Test with cURL

```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test Message",
    "message": "This is a test message from the contact form."
  }'
```

## 🔒 Security Features

The contact form includes several security measures:

### Email Validation
- **Strict email format validation**
- **Fake email detection** (blocks test@, fake@, dummy@, etc.)
- **Disposable email blocking** (blocks temporary email services)
- **Domain validation**

### Rate Limiting
- **100 requests per 15 minutes** per IP address
- **Prevents spam and abuse**

### Input Validation
- **Name**: 2-100 characters
- **Email**: Valid email format
- **Subject**: 1-200 characters
- **Message**: 10-1000 characters

## 📧 Email Template

The contact form sends beautifully formatted emails with:

- **HTML and text versions**
- **Contact details section**
- **Message content**
- **Reply-to functionality**
- **Professional styling**

## 🐛 Troubleshooting

### Common Issues

1. **"Authentication failed"**
   - Check your email credentials
   - Ensure 2FA is enabled for Gmail
   - Verify app password is correct

2. **"Connection timeout"**
   - Check SMTP host and port
   - Verify firewall settings
   - Try different SMTP settings

3. **"Rate limit exceeded"**
   - Wait 15 minutes before trying again
   - Check if multiple requests are being sent

4. **"Invalid email format"**
   - Ensure email follows proper format
   - Check for fake/temporary email domains

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

This will show detailed email sending logs in the console.

## 🚀 Production Deployment

For production, we recommend:

1. **Use SendGrid or Mailgun** for reliability
2. **Set up proper DNS records** (SPF, DKIM, DMARC)
3. **Monitor email delivery rates**
4. **Set up email bounce handling**
5. **Use environment-specific configurations**

## 📞 Support

If you encounter issues:

1. Check the backend logs for error messages
2. Verify your email configuration
3. Test with a simple email first
4. Contact support if problems persist

---

**Note**: The contact form is now fully functional and will send emails to `contact@saveytb.com` once properly configured! 🎉
