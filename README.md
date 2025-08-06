# Interior Calculator Backend - Mobile OTP Authentication

A Node.js Express server for mobile login OTP verification with Twilio SMS integration, rate limiting, and CORS configuration.

## Features

- 📱 Mobile OTP authentication
- 📧 Twilio SMS integration
- 🛡️ Rate limiting protection
- 🌐 CORS configuration
- ⚡ TypeScript support
- 🔒 Environment-based configuration

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

### Getting Twilio Credentials

1. Sign up for a [Twilio account](https://www.twilio.com/try-twilio)
2. Go to the [Twilio Console](https://console.twilio.com/)
3. Find your `Account SID` and `Auth Token` in the dashboard
4. Purchase a phone number from Twilio Console > Phone Numbers > Manage > Buy a number
5. Use the purchased number as your `TWILIO_PHONE_NUMBER` (include country code, e.g., +1234567890)

## API Endpoints

### Send OTP
```
POST /api/auth/send-otp
Content-Type: application/json

{
  "mobile": "+1234567890"
}
```

### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "mobile": "+1234567890",
  "otp": "123456"
}
```

### Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "mobile": "+1234567890"
}
```

### Health Check
```
GET /api/health
```

## Rate Limiting

- **Send/Resend OTP**: 5 requests per 15 minutes per IP
- **Verify OTP**: 10 requests per 15 minutes per IP
- **OTP Verification**: 3 attempts per mobile number

## Development

```bash
# Development with auto-reload
npm run dev

# Build and run
npm run build
npm start
```

## Security Features

- Mobile number validation
- OTP expiry (5 minutes)
- Attempt limiting (3 attempts per OTP)
- Rate limiting by IP address
- CORS configuration
- Environment-based configuration

## Production Considerations

- Use Redis or database for OTP storage instead of in-memory storage
- Implement proper JWT token generation
- Add proper logging and monitoring
- Use HTTPS in production
- Configure proper CORS origins
- Add input sanitization and validation
- Implement proper error handling 