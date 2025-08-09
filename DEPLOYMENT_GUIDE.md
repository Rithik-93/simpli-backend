# WhatsApp QR Code Deployment Guide

## Problem
When deploying WhatsApp Web automation to cloud services like render.com, you can't access the QR code that appears on the server's browser.

## Solution
This implementation provides a web-based QR code scanner that you can access remotely.

## Environment Variables

Set these environment variables in your deployment platform:

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-domain.com
ADMIN_TOKEN=your-secure-admin-token-here  # For QR code endpoint security
```

## How to Deploy

### 1. Deploy to Render.com (or similar service)

1. Connect your GitHub repository to Render.com
2. Create a new Web Service
3. Use the following settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node.js

### 2. Set Environment Variables
```
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend-url.com
```

### 3. Access QR Code After Deployment

1. **Visit the QR Code Page**: `https://your-app.onrender.com/api/whatsapp/qr`
2. **Click "Initialize WhatsApp Session"** 
3. **Scan the QR code** with your WhatsApp mobile app
4. **Done!** The session will be saved and you won't need to scan again

## Important Features

### 🔄 Session Persistence
- WhatsApp session is saved to `./wbm_session` folder
- You only need to scan QR code once per deployment
- Session survives server restarts

### 📱 Remote QR Code Access
- Access QR code at: `https://your-app.onrender.com/api/whatsapp/qr`
- Real-time status updates
- Auto-refresh every 5 seconds

### 🛡️ Headless Mode
- Runs without browser UI on server
- Perfect for cloud deployment
- No display required

## API Endpoints

- `GET /api/whatsapp/qr` - QR code web interface
- `GET /api/whatsapp/status` - Check session status
- `POST /api/whatsapp/initialize` - Start WhatsApp session
- `POST /api/whatsapp/restart` - Restart session (if needed)

## Deployment Steps

1. **Deploy your app** to render.com/heroku/etc
2. **Wait for deployment** to complete
3. **Open** `https://your-app.onrender.com/api/whatsapp/qr`
4. **Click** "Initialize WhatsApp Session"
5. **Scan QR code** with your phone
6. **You're done!** WhatsApp is now connected

## Troubleshooting

### If QR Code doesn't appear:
1. Check server logs for errors
2. Try clicking "Initialize WhatsApp Session" again
3. Use the restart endpoint if needed

### If session disconnects:
1. Go to `/api/whatsapp/qr`
2. Click "Initialize WhatsApp Session"
3. Scan the new QR code

### For production:
- Consider using Redis for session storage instead of files
- Add authentication to QR code endpoint
- Set up monitoring for session health

## Security Notes
- The QR code endpoint is public - consider adding authentication
- Session data is stored in files - consider using encrypted storage
- Monitor for unauthorized access to the QR endpoint 