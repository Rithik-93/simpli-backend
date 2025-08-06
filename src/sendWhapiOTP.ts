import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

interface WhatsAppMessageOptions {
  to: string;
  body: string;
  typing_time?: number;
}

const sendWhatsAppMessage = async (options: WhatsAppMessageOptions) => {
  // Check if WHAPI token is configured
  const whapiToken = process.env.WHAPI_TOKEN;
  const whapiBaseUrl = process.env.WHAPI_BASE_URL || 'https://gate.whapi.cloud';
  
  if (!whapiToken) {
    throw new Error('WHAPI_TOKEN is not configured in environment variables');
  }

  const requestOptions = {
    method: 'POST',
    url: `${whapiBaseUrl}/messages/text`,
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: `Bearer ${whapiToken}`
    },
    data: {
      typing_time: options.typing_time || 0,
      to: options.to,
      body: options.body
    }
  };

  try {
    const response = await axios.request(requestOptions);
    console.log(response.data)
    if (response.data?.sent === true) {
      return response.data;
    } else {
      throw new Error('Failed to send OTP');
    }
  } catch (error: any) {
    throw error;
  }
};

// const sendOTP = async () => {
//   try {
//     console.log('📱 Sending WhatsApp message...');
//     const response = await sendWhatsAppMessage({
//       to: '919704402301',
//       body: 'Hello, this message was sent via API!',
//       typing_time: 0
//     });
//     console.log('This Message sent successfully:', response.message);
//     console.log('✅ Message sent successfully:', response);
//     return response;
//   } catch (error: any) {
//     console.error('❌ Failed to send OTP:', error);
//     throw error;
//   }
// };

// // Only run if this file is executed directly
// if (require.main === module) {
//   sendOTP().catch(console.error);
// }

export default sendWhatsAppMessage;