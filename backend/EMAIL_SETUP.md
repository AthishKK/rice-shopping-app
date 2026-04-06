# Email Setup for OTP and Notifications

## Development Mode (Current)
- OTPs are logged to console and server logs
- No email configuration required
- Check browser console (F12) or server terminal for OTPs

## Production Setup (Optional)

### Gmail Setup
1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Update `.env` file:
   ```
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-16-character-app-password
   ```

### Other Email Services
Update the `createTransporter()` function in `services/notificationService.js`:

#### SendGrid
```javascript
return nodemailer.createTransporter({
  service: 'SendGrid',
  auth: {
    user: 'apikey',
    pass: process.env.SENDGRID_API_KEY
  }
});
```

#### Outlook/Hotmail
```javascript
return nodemailer.createTransporter({
  service: 'hotmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});
```

## Testing
1. Set up email credentials in `.env`
2. Restart the server
3. Try forgot password functionality
4. Check both email and console logs

## Fallback
If email sending fails, OTPs will still be logged to console as backup.