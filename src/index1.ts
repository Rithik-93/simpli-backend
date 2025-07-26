import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
// @ts-ignore: No type definitions for '../api.js'
import wbm from '../api.js';
// @ts-ignore: No type definitions for 'qrcode-terminal'
import * as qrcode from 'qrcode-terminal';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for OTPs (use Redis or database in production)
const otpStorage = new Map<string, { otp: string; expiry: number; attempts: number }>();

// WhatsApp session management
let wbmSession: any = null;
let isWbmStarting = false;
let qrCodeDataUrl: string | null = null;
let sessionStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected'

const MAX_SESSION_FAILURES = 3;
let sessionFailureCount = 0;
let lastSessionCheck = Date.now();

const frontendUrl = process.env.FRONTEND_URL;

if (!frontendUrl) {
  throw new Error('FRONTEND_URL is not set');
}

// CORS configuration
app.use(cors({
  origin: [frontendUrl], // Add your frontend URLs
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// JSON parser middleware
app.use(express.json());

// Rate limiting middleware
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many OTP requests from this IP, please try again later.'
  }
});

const verifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 verification attempts per windowMs
  message: {
    error: 'Too many verification attempts from this IP, please try again later.'
  }
});

// Utility function to generate OTP
const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Utility function to normalize mobile number (add 91 if needed)
const normalizeMobileNumber = (mobile: string): string => {
  // Remove all spaces and special characters
  let cleanNumber = mobile.replace(/[^\d]/g, '');

  // If number starts with +91, remove + and return
  if (mobile.startsWith('+91')) {
    return cleanNumber;
  }

  // If number starts with 91 and is 12 digits, return as is
  if (cleanNumber.startsWith('91') && cleanNumber.length === 12) {
    return cleanNumber;
  }

  // If number is 10 digits and starts with 6,7,8,9 (Indian mobile), add 91
  if (cleanNumber.length === 10 && /^[6-9]/.test(cleanNumber)) {
    return '91' + cleanNumber;
  }

  // If number starts with 0 (remove leading 0 and add 91)
  if (cleanNumber.startsWith('0') && cleanNumber.length === 11) {
    return '91' + cleanNumber.substring(1);
  }

  return cleanNumber;
};

// Utility function to validate Indian mobile number
const isValidMobileNumber = (mobile: string): boolean => {
  const normalizedNumber = normalizeMobileNumber(mobile);

  // Check if it's a valid Indian mobile number (91 followed by 10 digits starting with 6,7,8,9)
  const indianMobileRegex = /^91[6-9]\d{9}$/;
  return indianMobileRegex.test(normalizedNumber);
};

// Initialize WhatsApp session
const initializeWhatsAppSession = async (): Promise<void> => {
  if (wbmSession || isWbmStarting) return;
  
  isWbmStarting = true;
  sessionStatus = 'connecting';
  
  try {
    await wbm.start({ 
      showBrowser: false, // Set to false for headless mode
      qrCodeData: true,
      session: true, // Enable session persistence
      sessionFolderPath: './wbm_session', // Session storage folder
      qrCodeValue: (qrCodeData: string) => {
        // Display QR code in terminal
        console.log('\n🔗 WhatsApp QR Code:');
        qrcode.generate(qrCodeData, { small: true });
        console.log('\n📱 Scan the QR code above with your WhatsApp mobile app');
        console.log(`🌐 Or visit: http://localhost:${PORT}/api/whatsapp/qr\n`);
        
        // Also store for web access
        qrCodeDataUrl = qrCodeData;
      }
    }).then(async () => {
      console.log('WhatsApp session started successfully');
      wbmSession = wbm;
      sessionStatus = 'connected';
      qrCodeDataUrl = null; // Clear QR code once connected
    }).catch((err: any) => {
      console.error('WhatsApp session error:', err);
      sessionStatus = 'disconnected';
    });
  } catch (error) {
    console.error('Failed to initialize WhatsApp session:', error);
    sessionStatus = 'disconnected';
  } finally {
    isWbmStarting = false;
  }
};

// SMS service function with improved error handling
const sendSMSOTP = async (mobile: string, otp: string): Promise<{ success: boolean; method: string; error?: string }> => {
  const maxRetries = 3;
  let lastError: string = '';
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📱 Attempting to send OTP via WhatsApp (attempt ${attempt}/${maxRetries}) to ${mobile}`);
      
      // Initialize session if not already connected
      if (!wbmSession || sessionStatus !== 'connected') {
        await initializeWhatsAppSession();
      }
      
      // Wait for session to be ready with timeout
      let attempts = 0;
      while (sessionStatus === 'connecting' && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }
      
      if (sessionStatus !== 'connected') {
        throw new Error('WhatsApp session not connected after timeout');
      }
      
      const phones = [mobile];
      const message = `🔐 Your SimplifyHomes OTP is: ${otp}\n\nThis OTP will expire in 5 minutes.\nDo not share this with anyone.`;
      
      await wbm.send(phones, message);
      
      console.log(`✅ SMS sent successfully to ${mobile} via WhatsApp`);
      sessionFailureCount = 0; // Reset failure count on success
      return { success: true, method: 'whatsapp' };
      
    } catch (error) {
      lastError = error instanceof Error ? error.message : 'Unknown error';
      console.error(`❌ Attempt ${attempt} failed to send SMS to ${mobile}:`, lastError);
      
      sessionFailureCount++;
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All WhatsApp attempts failed
  console.error(`❌ All WhatsApp attempts failed for ${mobile}. Last error: ${lastError}`);
  
  // TODO: Implement fallback SMS service here
  // Example:
  // try {
  //   await sendFallbackSMS(mobile, otp);
  //   return { success: true, method: 'sms_fallback' };
  // } catch (fallbackError) {
  //   console.error('Fallback SMS also failed:', fallbackError);
  // }
  
  return { 
    success: false, 
    method: 'whatsapp', 
    error: `Failed after ${maxRetries} attempts: ${lastError}` 
  };
};

// Add fallback SMS service placeholder
const sendFallbackSMS = async (mobile: string, otp: string): Promise<boolean> => {
  // TODO: Implement actual SMS service (TextLocal, MSG91, etc.)
  console.log(`📧 Fallback SMS service not implemented for ${mobile}`);
  return false;
};

// Route to get WhatsApp QR code
app.get('/api/whatsapp/qr', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>WhatsApp QR Code</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
            .container { max-width: 500px; margin: 0 auto; }
            .status { padding: 20px; margin: 20px 0; border-radius: 8px; }
            .connected { background-color: #d4edda; color: #155724; }
            .connecting { background-color: #fff3cd; color: #856404; }
            .disconnected { background-color: #f8d7da; color: #721c24; }
            .qr-container { margin: 20px 0; }
            button { padding: 10px 20px; font-size: 16px; margin: 10px; cursor: pointer; }
            #qrcode { max-width: 100%; height: auto; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>WhatsApp QR Code Scanner</h1>
            <div id="status" class="status"></div>
            <div id="qr-container" class="qr-container"></div>
            <button onclick="initializeSession()">Initialize WhatsApp Session</button>
            <button onclick="checkStatus()">Check Status</button>
        </div>
        
        <script>
            async function checkStatus() {
                try {
                    const response = await fetch('/api/whatsapp/status');
                    const data = await response.json();
                    updateStatus(data.status, data.qrCode);
                } catch (error) {
                    console.error('Error checking status:', error);
                }
            }
            
            async function initializeSession() {
                try {
                    const response = await fetch('/api/whatsapp/initialize', { method: 'POST' });
                    const data = await response.json();
                    updateStatus(data.status, data.qrCode);
                } catch (error) {
                    console.error('Error initializing session:', error);
                }
            }
            
            function updateStatus(status, qrCode) {
                const statusDiv = document.getElementById('status');
                const qrContainer = document.getElementById('qr-container');
                
                statusDiv.className = 'status ' + status;
                
                if (status === 'connected') {
                    statusDiv.innerHTML = '✅ WhatsApp is connected and ready!';
                    qrContainer.innerHTML = '';
                } else if (status === 'connecting') {
                    statusDiv.innerHTML = '🔄 Connecting to WhatsApp...';
                    if (qrCode) {
                        qrContainer.innerHTML = '<img id="qrcode" src="' + qrCode + '" alt="QR Code" /><br><p>Scan this QR code with your WhatsApp mobile app</p>';
                    }
                } else {
                    statusDiv.innerHTML = '❌ WhatsApp is disconnected';
                    qrContainer.innerHTML = '';
                }
            }
            
            // Check status on page load
            checkStatus();
            
            // Auto-refresh status every 5 seconds
            setInterval(checkStatus, 5000);
        </script>
    </body>
    </html>
  `);
});

// Route to get WhatsApp session status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: sessionStatus,
    qrCode: qrCodeDataUrl,
    message: sessionStatus === 'connected' ? 'WhatsApp is ready' : 
             sessionStatus === 'connecting' ? 'Waiting for QR code scan' : 
             'WhatsApp is disconnected'
  });
});

// Route to initialize WhatsApp session
app.post('/api/whatsapp/initialize', async (req, res) => {
  try {
    await initializeWhatsAppSession();
    res.json({
      status: sessionStatus,
      qrCode: qrCodeDataUrl,
      message: 'WhatsApp session initialization started'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initialize WhatsApp session'
    });
  }
});

// Route to restart WhatsApp session
app.post('/api/whatsapp/restart', async (req, res) => {
  try {
    // End current session if exists
    if (wbmSession) {
      await wbm.end();
    }
    
    // Reset session variables
    wbmSession = null;
    sessionStatus = 'disconnected';
    qrCodeDataUrl = null;
    isWbmStarting = false;
    
    // Start new session
    await initializeWhatsAppSession();
    
    res.json({
      status: sessionStatus,
      qrCode: qrCodeDataUrl,
      message: 'WhatsApp session restarted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restart WhatsApp session'
    });
  }
});

// Route to send OTP
app.post('/api/auth/send-otp', otpRateLimit, async (req, res) => {
  try {
    const { mobile } = req.body;

    // Validate mobile number
    if (!mobile || !isValidMobileNumber(mobile)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mobile number format. Please enter a valid Indian mobile number.'
      });
    }

    // Normalize mobile number
    const normalizedMobile = normalizeMobileNumber(mobile);

    // Generate OTP
    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store OTP with normalized mobile number
    otpStorage.set(normalizedMobile, {
      otp,
      expiry,
      attempts: 0
    });

    // Send SMS OTP
    const smsSent = await sendSMSOTP(normalizedMobile, otp);

    if (smsSent.success === false) {
      return res.status(400).json({
        success: false,
        error: smsSent.error || 'Failed to send SMS'
      });
    }

    res.json({
      success: smsSent.success,
      message: 'OTP sent successfully',
      data: {
        mobile: normalizedMobile,
        smsSent: smsSent.method,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Route to verify OTP
app.post('/api/auth/verify-otp', verifyRateLimit, (req, res) => {
  try {
    const { mobile, otp } = req.body;

    // Validate input
    if (!mobile || !otp) {
      return res.status(400).json({
        success: false,
        error: 'Mobile number and OTP are required'
      });
    }

    // Normalize mobile number
    const normalizedMobile = normalizeMobileNumber(mobile);

    // Check if OTP exists
    const storedOtpData = otpStorage.get(normalizedMobile);
    if (!storedOtpData) {
      return res.status(400).json({
        success: false,
        error: 'OTP not found or expired'
      });
    }

    // Check if OTP is expired
    if (Date.now() > storedOtpData.expiry) {
      otpStorage.delete(normalizedMobile);
      return res.status(400).json({
        success: false,
        error: 'OTP has expired'
      });
    }

    // Check attempts limit
    if (storedOtpData.attempts >= 3) {
      otpStorage.delete(normalizedMobile);
      return res.status(400).json({
        success: false,
        error: 'Maximum verification attempts exceeded'
      });
    }

    // Verify OTP
    if (storedOtpData.otp !== otp) {
      // Increment attempts
      storedOtpData.attempts++;
      otpStorage.set(normalizedMobile, storedOtpData);

      return res.status(400).json({
        success: false,
        error: 'Invalid OTP',
        attemptsLeft: 3 - storedOtpData.attempts
      });
    }

    // OTP verified successfully
    otpStorage.delete(normalizedMobile);

    res.json({
      success: true,
      message: 'OTP verified successfully',
      data: {
        mobile: normalizedMobile,
        user: {
          id: `user_${normalizedMobile}`,
          mobile: normalizedMobile,
          verified: true
        }
      }
    });

  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Route to resend OTP
app.post('/api/auth/resend-otp', otpRateLimit, async (req, res) => {
  try {
    const { mobile } = req.body;

    if (!mobile || !isValidMobileNumber(mobile)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mobile number format. Please enter a valid Indian mobile number.'
      });
    }

    // Normalize mobile number
    const normalizedMobile = normalizeMobileNumber(mobile);

    // Generate new OTP
    const otp = generateOTP();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    // Store new OTP with normalized mobile number
    otpStorage.set(normalizedMobile, {
      otp,
      expiry,
      attempts: 0
    });

    // Send SMS OTP
    const smsSent = await sendSMSOTP(normalizedMobile, otp);

    if (smsSent.success === false) {
      return res.status(400).json({
        success: false,
        error: smsSent.error || 'Failed to send SMS'
      });
    }

    res.json({
      success: smsSent.success,
      message: 'OTP resent successfully',
      data: {
        mobile: normalizedMobile,
        smsSent: smsSent.method,
        otp: process.env.NODE_ENV === 'development' ? otp : undefined
      }
    });

  } catch (error) {
    console.error('Error resending OTP:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Initialize WhatsApp session on server startup
const initializeOnStartup = async () => {
  try {
    console.log('🔄 Initializing WhatsApp session...');
    await initializeWhatsAppSession();
    
    // Start session monitoring
    monitorSessionHealth();
    
    console.log('✅ WhatsApp session initialization completed');
  } catch (error) {
    console.error('❌ Failed to initialize WhatsApp session on startup:', error);
  }
};

// Add production monitoring endpoint
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      sessionStatus,
      sessionFailureCount,
      lastSessionCheck: new Date(lastSessionCheck).toISOString(),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeOTPs: otpStorage.size,
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Add session management endpoint
app.post('/api/admin/session/force-restart', async (req, res) => {
  try {
    console.log('🔄 Admin requested session restart');
    await restartWhatsAppSession();
    res.json({
      success: true,
      message: 'Session restart initiated',
      status: sessionStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to restart session'
    });
  }
});

// Add OTP cleanup endpoint
app.post('/api/admin/cleanup-expired-otps', (req, res) => {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [mobile, otpData] of otpStorage.entries()) {
    if (now > otpData.expiry) {
      otpStorage.delete(mobile);
      cleanedCount++;
    }
  }
  
  res.json({
    success: true,
    message: `Cleaned up ${cleanedCount} expired OTPs`,
    remainingOTPs: otpStorage.size
  });
});

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  try {
    if (wbmSession) {
      await wbm.end();
      console.log('✅ WhatsApp session closed');
    }
  } catch (error) {
    console.error('❌ Error closing WhatsApp session:', error);
  }
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 WhatsApp QR Code: http://localhost:${PORT}/api/whatsapp/qr`);
  
  // Initialize WhatsApp session
  await initializeOnStartup();
});

// Add session health monitoring
const monitorSessionHealth = () => {
  setInterval(async () => {
    if (sessionStatus === 'connected' && wbmSession) {
      try {
        // Simple health check - try to send a test message to yourself
        // This is a basic way to verify the session is still active
        console.log('🔍 Checking WhatsApp session health...');
        lastSessionCheck = Date.now();
      } catch (error) {
        console.error('❌ Session health check failed:', error);
        sessionFailureCount++;
        
        if (sessionFailureCount >= MAX_SESSION_FAILURES) {
          console.log('🔄 Maximum session failures reached, restarting session...');
          await restartWhatsAppSession();
        }
      }
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
};

// Add session restart function
const restartWhatsAppSession = async () => {
  try {
    console.log('🔄 Restarting WhatsApp session...');
    
    if (wbmSession) {
      await wbm.end().catch(console.error);
    }
    
    // Reset session variables
    wbmSession = null;
    sessionStatus = 'disconnected';
    qrCodeDataUrl = null;
    isWbmStarting = false;
    sessionFailureCount = 0;
    
    // Wait before restart
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Restart session
    await initializeWhatsAppSession();
    
    console.log('✅ WhatsApp session restarted');
  } catch (error) {
    console.error('❌ Failed to restart WhatsApp session:', error);
  }
};

export default app;
