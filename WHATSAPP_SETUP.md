# WhatsApp OTP Setup Guide

This guide will help you set up WhatsApp for OTP delivery in the Interior Calculator backend service.

## Prerequisites

- Node.js installed on your system
- WhatsApp installed on your mobile device
- Stable internet connection
- A dedicated phone number for WhatsApp (recommended for production)

## Setup Process

### 1. Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
```

### 2. Run WhatsApp Setup

Execute the setup script to authenticate your WhatsApp account:

```bash
npm run setup-whatsapp
```

This will:
- Open a browser window with WhatsApp Web
- Display a QR code in the terminal
- Wait for you to scan the QR code with your phone

### 3. Scan QR Code

1. Open WhatsApp on your mobile device
2. Go to **Settings** > **Linked Devices** (or **WhatsApp Web/Desktop**)
3. Tap **"Link a Device"**
4. Scan the QR code displayed in the terminal or browser

### 4. Complete Setup

Once the QR code is scanned:
- The setup script will confirm successful authentication
- Your WhatsApp session will be saved for future use
- The browser will close automatically

## Using the WhatsApp OTP Service

### Starting the Server

```bash
npm run dev
```

The server will automatically attempt to connect to WhatsApp using the saved session.

### API Endpoints

#### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "+919876543210"
}
```

#### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "+919876543210",
  "otp": "123456"
}
```

#### Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "mobile": "+919876543210"
}
```

#### Initialize WhatsApp (Admin)
```
POST /api/admin/init-whatsapp
```

#### Health Check
```
GET /health
```

### Response Format

All OTP endpoints now return WhatsApp-specific responses:

```json
{
  "success": true,
  "message": "OTP sent successfully via WhatsApp",
  "data": {
    "mobile": "+919876543210",
    "whatsappSent": true,
    "otp": "123456"  // Only in development mode
  }
}
```

## Message Format

OTP messages are sent in the following format:

```
🔐 Your OTP is: 123456

This OTP will expire in 5 minutes.

Please do not share this OTP with anyone.

- Interior Calculator Team
```

## Troubleshooting

### Common Issues

1. **QR Code Not Displaying**
   - Ensure you have a stable internet connection
   - Try running the setup script again
   - Check if WhatsApp Web is accessible in your browser

2. **WhatsApp Session Expired**
   - Run the setup script again: `npm run setup-whatsapp`
   - This will create a new session

3. **OTP Not Sending**
   - Check if WhatsApp is properly initialized
   - Use the `/api/admin/init-whatsapp` endpoint
   - Verify the phone number format is correct

4. **Server Startup Issues**
   - Make sure the WhatsApp session is properly saved
   - Check the console logs for any error messages
   - Restart the server if needed

### Environment Variables

Make sure you have the following environment variables set:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

### Session Management

- WhatsApp sessions are saved in the `tmp/` directory
- Sessions persist across server restarts
- If you need to reset the session, delete the `tmp/` directory and run setup again

### Production Considerations

1. **Dedicated Phone Number**: Use a dedicated phone number for production
2. **Session Backup**: Regularly backup the session data
3. **Monitoring**: Monitor WhatsApp connection status
4. **Rate Limiting**: The existing rate limiting will prevent spam
5. **Security**: Ensure proper security measures for the admin endpoints

## Benefits of WhatsApp OTP

- **Cost-effective**: No SMS charges
- **Higher delivery rate**: WhatsApp messages are more reliable
- **Better user experience**: Most users have WhatsApp installed
- **Rich formatting**: Support for emojis and formatted messages
- **Global reach**: WhatsApp works internationally

## Support

If you encounter any issues:

1. Check the console logs for detailed error messages
2. Verify your internet connection
3. Ensure WhatsApp Web is accessible
4. Try re-running the setup process

## Security Notes

- Keep your WhatsApp session secure
- Use environment variables for sensitive configuration
- Monitor the WhatsApp connection status
- Implement proper logging for production use 