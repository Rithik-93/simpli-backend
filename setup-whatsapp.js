const wbm = require('wbm');

console.log('🔧 WhatsApp Setup for Interior Calculator OTP Service');
console.log('==============================================');
console.log('');
console.log('This script will help you set up WhatsApp for OTP delivery.');
console.log('You will need to scan a QR code with your WhatsApp mobile app.');
console.log('');
console.log('📱 Please have your phone ready with WhatsApp installed.');
console.log('');

const setupWhatsApp = async () => {
  try {
    console.log('🚀 Starting WhatsApp setup...');
    
    // Start WhatsApp with QR code display
    await wbm.start({
      showBrowser: true,  // Show browser for debugging
      qrCodeData: false,  // Display QR code in terminal
      session: true       // Save session for future use
    });

    console.log('');
    console.log('✅ WhatsApp setup completed successfully!');
    console.log('📱 Your WhatsApp session has been saved.');
    console.log('🔄 The backend server can now use this session to send OTP messages.');
    console.log('');
    console.log('To test the setup, you can now:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Test the OTP endpoint with a valid mobile number');
    console.log('');
    
    // Close the connection
    await wbm.end();
    
  } catch (error) {
    console.error('❌ WhatsApp setup failed:', error);
    console.log('');
    console.log('Please try the following:');
    console.log('1. Make sure you have a stable internet connection');
    console.log('2. Ensure WhatsApp is installed on your phone');
    console.log('3. Try running the setup again');
    console.log('4. If the issue persists, check the WhatsApp Web status');
    
    process.exit(1);
  }
};

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Setup cancelled by user');
  try {
    await wbm.end();
  } catch (error) {
    // Ignore errors during cleanup
  }
  process.exit(0);
});

// Start setup
setupWhatsApp(); 