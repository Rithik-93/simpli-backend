// import express from 'express';
// import cors from 'cors';
// import rateLimit from 'express-rate-limit';
// import SendOtp from 'sendotp';
// import dotenv from 'dotenv';

// // Load environment variables
// dotenv.config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // MSG91 configuration
// const msg91AuthKey = '460296AztZVrBwJrGU6876229bP1';
// const msg91SenderId = process.env.MSG91_SENDER_ID;

// if (!msg91AuthKey) {
//   throw new Error('MSG91_AUTH_KEY must be set');
// }

// // Initialize MSG91 client
// const sendOtp = new SendOtp(msg91AuthKey);

// // In-memory storage for OTPs (use Redis or database in production)
// const otpStorage = new Map<string, { otp: string; expiry: number; attempts: number }>();

// const frontendUrl = process.env.FRONTEND_URL;

// if (!frontendUrl) {
//     throw new Error('FRONTEND_URL is not set');
// }

// // CORS configuration
// app.use(cors({
//   origin: [frontendUrl], // Add your frontend URLs
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// // JSON parser middleware
// app.use(express.json());

// // Rate limiting middleware
// const otpRateLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // limit each IP to 5 requests per windowMs
//   message: {
//     error: 'Too many OTP requests from this IP, please try again later.'
//   }
// });

// const verifyRateLimit = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // limit each IP to 10 verification attempts per windowMs
//   message: {
//     error: 'Too many verification attempts from this IP, please try again later.'
//   }
// });

// // Utility function to generate OTP
// const generateOTP = (): string => {
//   return Math.floor(100000 + Math.random() * 900000).toString();
// };

// // Utility function to validate mobile number
// const isValidMobileNumber = (mobile: string): boolean => {
//   const mobileRegex = /^[+]?[1-9]\d{1,14}$/;
//   return mobileRegex.test(mobile);
// };

// // SMS service function using MSG91
// const sendSMSOTP = async (mobile: string, otp: string): Promise<boolean> => {
//   if (!msg91AuthKey) {
//     console.log(`OTP for ${mobile}: ${otp} (MSG91 service not configured)`);
//     return false;
//   }

//   try {
//     return new Promise((resolve, reject) => {
//       sendOtp.send(mobile, msg91SenderId || 'TESTIN', otp, (error: any, data: any) => {
//         if (error) {
//           console.error(`Failed to send SMS to ${mobile}:`, error);
//           reject(error);
//           return;
//         }
        
//         console.log(`SMS sent successfully to ${mobile}. Response:`, data);
//         resolve(true);
//       });
//     });
//   } catch (error) {
//     console.error(`Failed to send SMS to ${mobile}:`, error);
//     return false;
//   }
// };

// // Route to send OTP
// app.post('/api/auth/send-otp', otpRateLimit, async (req, res) => {
//   try {
//     const { mobile } = req.body;

//     // Validate mobile number
//     if (!mobile || !isValidMobileNumber(mobile)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid mobile number format'
//       });
//     }

//     // Generate OTP
//     const otp = generateOTP();
//     const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

//     // Store OTP
//     otpStorage.set(mobile, {
//       otp,
//       expiry,
//       attempts: 0
//     });

//     // Send SMS OTP
//     const smsSent = await sendSMSOTP(mobile, otp);

//     res.json({
//       success: true,
//       message: 'OTP sent successfully',
//       data: {
//         mobile,
//         smsSent,
//         // Don't send OTP in response in production
//         otp: process.env.NODE_ENV === 'development' ? otp : undefined
//       }
//     });

//   } catch (error) {
//     console.error('Error sending OTP:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // Route to verify OTP
// app.post('/api/auth/verify-otp', verifyRateLimit, (req, res) => {
//   try {
//     const { mobile, otp } = req.body;

//     // Validate input
//     if (!mobile || !otp) {
//       return res.status(400).json({
//         success: false,
//         error: 'Mobile number and OTP are required'
//       });
//     }

//     // Check if OTP exists
//     const storedOtpData = otpStorage.get(mobile);
//     if (!storedOtpData) {
//       return res.status(400).json({
//         success: false,
//         error: 'OTP not found or expired'
//       });
//     }

//     // Check if OTP is expired
//     if (Date.now() > storedOtpData.expiry) {
//       otpStorage.delete(mobile);
//       return res.status(400).json({
//         success: false,
//         error: 'OTP has expired'
//       });
//     }

//     // Check attempts limit
//     if (storedOtpData.attempts >= 3) {
//       otpStorage.delete(mobile);
//       return res.status(400).json({
//         success: false,
//         error: 'Maximum verification attempts exceeded'
//       });
//     }

//     // Verify OTP
//     if (storedOtpData.otp !== otp) {
//       // Increment attempts
//       storedOtpData.attempts++;
//       otpStorage.set(mobile, storedOtpData);
      
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid OTP',
//         attemptsLeft: 3 - storedOtpData.attempts
//       });
//     }

//     // OTP verified successfully
//     otpStorage.delete(mobile);

//     res.json({
//       success: true,
//       message: 'OTP verified successfully',
//       data: {
//         mobile,
//         user: {
//           id: `user_${mobile}`,
//           mobile,
//           verified: true
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Error verifying OTP:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // Health check endpoint
// app.get('/health', (req, res) => {
//   res.json({
//     success: true,
//     message: 'Server is running',
//     timestamp: new Date().toISOString()
//   });
// });

// // Route to resend OTP
// app.post('/api/auth/resend-otp', otpRateLimit, async (req, res) => {
//   try {
//     const { mobile } = req.body;

//     if (!mobile || !isValidMobileNumber(mobile)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid mobile number format'
//       });
//     }

//     // Generate new OTP
//     const otp = generateOTP();
//     const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

//     // Store new OTP
//     otpStorage.set(mobile, {
//       otp,
//       expiry,
//       attempts: 0
//     });

//     // Send SMS OTP
//     const smsSent = await sendSMSOTP(mobile, otp);

//     res.json({
//       success: true,
//       message: 'OTP resent successfully',
//       data: {
//         mobile,
//         smsSent,
//         otp: process.env.NODE_ENV === 'development' ? otp : undefined
//       }
//     });

//   } catch (error) {
//     console.error('Error resending OTP:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Internal server error'
//     });
//   }
// });

// // Error handling middleware
// app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   console.error('Unhandled error:', err);
//   res.status(500).json({
//     success: false,
//     error: 'Internal server error'
//   });
// });

// // 404 handler
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: 'Endpoint not found'
//   });
// });

// // Start server
// app.listen(PORT, () => {
//   console.log(`🚀 Server is running on port ${PORT}`);
//   console.log(`📱 Health check: http://localhost:${PORT}/api/health`);
// });

// export default app;
