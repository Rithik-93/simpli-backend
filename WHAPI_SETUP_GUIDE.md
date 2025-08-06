# WHAPI.cloud Setup Guide

## The 404 Error Issue

The 404 error you're experiencing is caused by an **invalid/expired bearer token** in your WHAPI.cloud configuration.

## Current Problems Fixed

1. ✅ **Hard-coded token removed** - Now uses environment variables
2. ✅ **Server port mismatch fixed** - Now uses PORT from environment
3. ✅ **Better error handling** - Will show clear error if token is missing

## Steps to Fix WHAPI.cloud Integration

### 1. Get a Valid WHAPI Token

1. Go to [WHAPI.cloud Dashboard](https://whapi.cloud/dashboard)
2. Sign up or log in to your account
3. Create a new WhatsApp channel/instance
4. Copy your **API Token** from the dashboard

### 2. Create `.env` File

Create a `.env` file in your `simpligyBackend` directory with:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# MongoDB Configuration (update with your actual MongoDB URI)
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/your_database

# WHAPI.cloud Configuration
WHAPI_TOKEN=your_actual_token_from_whapi_dashboard
WHAPI_BASE_URL=https://gate.whapi.cloud
```

### 3. Replace the Token

Replace `your_actual_token_from_whapi_dashboard` with the actual token from your WHAPI.cloud dashboard.

### 4. Test the Setup

1. Restart your server:
   ```bash
   bun dev
   ```

2. Test the OTP endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/auth/send-otp \
     -H "Content-Type: application/json" \
     -d '{"mobile": "+919876543210"}'
   ```

## WHAPI.cloud Account Setup

### Free Tier Limitations
- WHAPI.cloud typically offers limited free messages
- You may need to verify your account or add payment method
- Check your dashboard for usage limits

### Account Verification
1. Verify your phone number in WHAPI dashboard
2. Connect your WhatsApp Business account
3. Ensure your account status is "Active"

## Alternative: Free WhatsApp Solution

If you prefer a free solution, you can switch to the `wbm` (WhatsApp Business Manager) approach that's already set up in your project:

1. Run the WhatsApp setup:
   ```bash
   npm run setup-whatsapp
   ```

2. Scan the QR code with your phone
3. Modify the code to use `wbm` instead of WHAPI.cloud

## Troubleshooting

### Common WHAPI.cloud Errors

- **404 Error**: Invalid/expired token
- **401 Error**: Unauthorized token
- **403 Error**: Account not verified or insufficient credits
- **429 Error**: Rate limit exceeded

### Debug Steps

1. Check WHAPI.cloud dashboard for account status
2. Verify token is correctly copied (no extra spaces)
3. Check if your account has available message credits
4. Ensure your phone number is verified in WHAPI dashboard

## Testing Your Setup

After setting up the `.env` file with a valid token, your server should start without the 404 error. The console will show:

```
🚀 Server is running on port 3000
📱 Sending OTP via WhatsApp API to 917975248540
✅ OTP sent successfully to 917975248540 via WhatsApp API
```

Instead of the previous error:
```
❌ Failed to send OTP to 917975248540: Request failed with status code 404
```