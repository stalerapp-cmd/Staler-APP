

// src/services/smsService.ts

import axios from 'axios';
import { logger } from '../utils/logger';

class SmsService {
  private baseUrl = 'https://api.infobip.com/sms/2/text/advanced';
  private apiKey = process.env.INFOBIP_API_KEY || '';
  private sender = process.env.INFOBIP_SENDER || 'S-Taler';

  private isEnabled(): boolean {
    if (!this.apiKey) {
      logger.warn('⚠️ SMS service disabled - No API key configured');
      return false;
    }
    return true;
  }

 
async sendSms(phoneNumber: string, message: string): Promise<boolean> {
  if (!this.isEnabled()) {
    logger.warn('SMS not sent - service disabled');
    return false;
  }

  try {
    const response = await axios.post(
      this.baseUrl,
      {
        messages: [
          {
            from: this.sender,
            destinations: [{ to: phoneNumber }],
            text: message,
          },
        ],
      },
      {
        headers: {
          Authorization: `App ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    logger.info(`📱 SMS sent to ${phoneNumber}`);
    return true;
  } catch (error: any) {
    logger.error(`Failed to send SMS to ${phoneNumber}:`, error.message);
    return false;
  }
}
  async sendVerificationCode(phoneNumber: string, code: string, fullName: string): Promise<boolean> {
    const message = `Welcome to S-Taler, ${fullName}!\n\nYour verification code is: ${code}\n\nValid for 15 minutes.\n\nIf you didn't request this, please ignore.`;
    return this.sendSms(phoneNumber, message);
  }

  async sendPasswordResetCode(phoneNumber: string, code: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\nYour password reset code is: ${code}\n\nValid for 15 minutes.\n\nIf you didn't request this, please ignore.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendPasswordChangedNotification(phoneNumber: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\n✅ Your S-Taler password was changed successfully on ${new Date().toLocaleString()}.\n\nIf this wasn't you, contact support immediately.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendProfileUpdateCode(phoneNumber: string, code: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\nYour profile update verification code is: ${code}\n\nValid for 15 minutes.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendPhoneChangeAttemptWarning(phoneNumber: string, newPhoneNumber: string, code: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\n⚠️ Someone is trying to change your phone number to: ${newPhoneNumber}\n\nIf this is you, enter code: ${code}\n\nIf not, ignore this message.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendNameChangedNotification(phoneNumber: string, oldName: string, newName: string): Promise<boolean> {
    const message = `Hi there,\n\n📝 Your S-Taler account name was updated:\n\nOld: ${oldName}\nNew: ${newName}\n\nIf this wasn't you, contact support.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendImageChangedNotification(phoneNumber: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\n🖼️ Your S-Taler profile image was updated on ${new Date().toLocaleString()}.\n\nIf this wasn't you, contact support.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendAccountDeletionCode(phoneNumber: string, code: string, fullName: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\n⚠️ Account deletion requested.\n\nConfirmation code: ${code}\n\nValid for 15 minutes.\n\nThis action is permanent!\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }

  async sendEmailChangeLostAccessCode(phoneNumber: string, code: string, fullName: string, newEmail: string): Promise<boolean> {
    const message = `Hi ${fullName},\n\n🔓 Email change via phone verification.\n\nNew email: ${newEmail}\n\nCode: ${code}\n\nValid for 15 minutes.\n\n- S-Taler`;
    return this.sendSms(phoneNumber, message);
  }
}

export default new SmsService();