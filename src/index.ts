import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import sendWhatsAppMessage from './sendWhapiOTP';
import connectDB from './config/database';
import cmsRoutes from './routes/cms';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for OTPs (use Redis or database in production)
const otpStorage = new Map<string, { otp: string; expiry: number; attempts: number }>();

// WhatsApp API configuration
const WHATSAPP_API_ENABLED = true;

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

// SMS service function using whapi.cloud
const sendSMSOTP = async (mobile: string, otp: string): Promise<{ success: boolean; method: string; error?: string }> => {
  try {
    console.log(`📱 Sending OTP via WhatsApp API to ${mobile}`);
    
    const message = `🔐 Your OTP is: ${otp}\n\nThis OTP will expire in 5 minutes.\nDo not share this with anyone.`;
    
    await sendWhatsAppMessage({
      to: mobile,
      body: message,
      typing_time: 0
    });
    
    console.log(`✅ OTP sent successfully to ${mobile} via WhatsApp API`);
    return { success: true, method: 'whatsapp_api' };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ Failed to send OTP to ${mobile}:`, errorMessage);
    
    return { 
      success: false, 
      method: 'whatsapp_api', 
      error: "Internal Server Error. Please try again later." 
    };
  }
};

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

// Add CMS routes
app.use('/api/cms', cmsRoutes);

// Add production monitoring endpoint
app.get('/api/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      whatsappStatus: 'ready',
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      activeOTPs: otpStorage.size,
      environment: process.env.NODE_ENV || 'development'
    }
  });
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

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  process.exit(0);
});

// Connect to MongoDB
connectDB();

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`📱 WhatsApp API Status: http://localhost:${PORT}/api/whatsapp/status`);
  console.log(`📊 CMS API: http://localhost:${PORT}/api/cms`);
});

export default app;
