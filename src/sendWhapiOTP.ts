import axios from 'axios';

interface WhatsAppMessageOptions {
  to: string;
  body: string;
  typing_time?: number;
}

const sendWhatsAppMessage = async (options: WhatsAppMessageOptions) => {
  const requestOptions = {
    method: 'POST',
    url: 'https://gate.whapi.cloud/messages/text',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authorization: 'Bearer dHV21x164giNS0JA73aNpiq077ExApSG'
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