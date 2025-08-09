# VPS Headless Browser Setup Guide

This guide will help you set up the WhatsApp OTP service on a VPS with a headless browser configuration.

## Prerequisites

- Linux VPS (Ubuntu/Debian recommended)
- Root or sudo access
- Node.js 18+ and npm/bun installed

## Step 1: Install Chrome Dependencies

Run the provided script to install all required system dependencies:

```bash
# Make the script executable
chmod +x install-chrome-deps.sh

# Run as root/sudo
sudo ./install-chrome-deps.sh
```

Or manually install the dependencies:

```bash
sudo apt-get update

sudo apt-get install -y \
    gconf-service \
    libasound2 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgcc1 \
    libgconf-2-4 \
    libgdk-pixbuf2.0-0 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    ca-certificates \
    fonts-liberation \
    libappindicator1 \
    libnss3 \
    lsb-release \
    xdg-utils \
    wget \
    libgbm-dev \
    libxshmfence1
```

## Step 2: Configure Environment Variables

Create or update your `.env` file:

```bash
NODE_ENV=production
PORT=3000
FRONTEND_URL=http://your-frontend-domain.com
```

## Step 3: Update Puppeteer Configuration

The `api.js` file has been updated with VPS-optimized Chrome arguments:

- `--no-sandbox`: Disable sandboxing (required for most VPS environments)
- `--disable-setuid-sandbox`: Additional sandbox disabling
- `--disable-dev-shm-usage`: Use /tmp instead of /dev/shm (prevents crashes on limited VPS)
- `--disable-gpu`: Disable GPU acceleration (not available in headless)
- `--single-process`: Run in single process mode (helps on resource-limited VPS)

## Step 4: Test the Setup

1. Install dependencies:
```bash
npm install
# or
bun install
```

2. Start the server:
```bash
bun dev2
# or
npm run dev2
```

3. Check the logs for any errors. You should see:
```
🚀 Server is running on port 3000
📱 Health check: http://localhost:3000/health
📱 WhatsApp QR Code: http://localhost:3000/api/whatsapp/qr
🔄 Initializing WhatsApp session...
🔄 Starting WhatsApp session...
```

4. Visit the QR code URL in your browser:
```
http://your-server-ip:3000/api/whatsapp/qr
```

5. Scan the QR code with your WhatsApp mobile app.

## Step 5: Production Deployment

### Using PM2 (Recommended)

1. Install PM2 globally:
```bash
npm install -g pm2
```

2. Create a PM2 ecosystem file (`ecosystem.config.js`):
```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-otp-service',
    script: 'bun',
    args: 'run src/index1.ts',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

3. Start the application:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Systemd Service

1. Create a service file:
```bash
sudo nano /etc/systemd/system/whatsapp-otp.service
```

2. Add the following content:
```ini
[Unit]
Description=WhatsApp OTP Service
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/path/to/your/project
ExecStart=/usr/bin/bun run src/index1.ts
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

3. Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable whatsapp-otp
sudo systemctl start whatsapp-otp
```

## Troubleshooting

### Common Issues

1. **Chrome fails to launch**:
   - Ensure all dependencies are installed
   - Check if running as root (add `--no-sandbox` flag)
   - Verify sufficient memory (at least 512MB recommended)

2. **QR Code not displaying**:
   - Check browser console for errors
   - Verify WhatsApp Web is accessible
   - Try restarting the service

3. **Session not persisting**:
   - Check file permissions in the `wbm_session` directory
   - Ensure sufficient disk space
   - Verify the session directory is writable

4. **Memory issues**:
   - Add swap space if running on low-memory VPS
   - Use `--single-process` flag (already included)
   - Consider upgrading VPS resources

### Performance Optimization

1. **Memory Usage**:
   - Monitor with `htop` or `free -h`
   - Consider adding swap file if needed:
   ```bash
   sudo fallocate -l 1G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   ```

2. **CPU Usage**:
   - The headless browser can be CPU intensive
   - Consider using a VPS with at least 1 CPU core
   - Monitor with `top` or `htop`

## Security Considerations

1. **Firewall Configuration**:
   - Only expose port 3000 if needed for external access
   - Use a reverse proxy (nginx) for production
   - Consider VPN access for admin functions

2. **Environment Variables**:
   - Never commit `.env` files to version control
   - Use proper secret management in production

3. **Updates**:
   - Keep system packages updated
   - Monitor for Puppeteer/Chrome security updates

## Monitoring

### Health Checks

The service provides several endpoints for monitoring:

- `/health` - Basic health check
- `/api/whatsapp/status` - WhatsApp session status
- `/api/admin/stats` - Detailed statistics (production)

### Logging

Logs are output to stdout/stderr. To capture them:

```bash
# With PM2
pm2 logs whatsapp-otp-service

# With systemd
journalctl -u whatsapp-otp -f
```

## Support

If you encounter issues:

1. Check the logs for detailed error messages
2. Verify all dependencies are installed
3. Ensure sufficient system resources
4. Test with a minimal configuration first

The headless browser setup should now work reliably on your VPS!
