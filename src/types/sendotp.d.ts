declare module 'sendotp' {
  interface SendOtpOptions {
    template?: string;
  }

  interface SendOtpResponse {
    type: 'success' | 'error';
    message: string;
  }

  class SendOtp {
    constructor(authKey: string, template?: string);
    send(mobile: string, senderId?: string, otp?: string, callback?: (error: any, data: SendOtpResponse) => void): void;
    retry(mobile: string, retryVoice?: boolean, callback?: (error: any, data: SendOtpResponse) => void): void;
    verify(mobile: string, otp: string, callback?: (error: any, data: SendOtpResponse) => void): void;
    setOtpExpiry(minutes: string): void;
  }

  export = SendOtp;
} 