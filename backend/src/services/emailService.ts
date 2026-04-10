

// src/services/emailService.ts

import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      this.transporter.verify((error) => {
        if (error) {
          logger.error('❌ Email service connection failed:', error);
        } else {
          logger.info('✅ Email service ready');
        }
      });
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
    }
  }

  private async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      logger.error('Email transporter not initialized');
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"S-Taler" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      logger.info(`📧 Email sent to ${options.to}: ${info.messageId}`);
      return true;
    } catch (error: any) {
      logger.error(`Failed to send email to ${options.to}:`, error.message);
      return false;
    }
  }

  async sendWelcomeEmail(email: string, fullName: string, verificationCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to S-Taler!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            <p>Thank you for registering with S-Taler!</p>
            
            <div class="code-box">
              <p style="margin: 0; color: #666;">Your Verification Code</p>
              <div class="code">${verificationCode}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🎉 Welcome to S-Taler - Verify Your Email',
      html,
    });
  }

  async sendPasswordResetEmail(email: string, fullName: string, resetCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #f5576c; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #f5576c; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #f5576c; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="code-box">
              <p style="margin: 0; color: #666;">Your Reset Code</p>
              <div class="code">${resetCode}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
            </div>

            <p style="text-align: center; margin-top: 20px;">
              <strong>Wasn't you?</strong> Contact support immediately at <strong>support@staler.com</strong>
            </p>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🔐 Password Reset Request - S-Taler',
      html,
    });
  }

  async sendPasswordChangedEmail(email: string, fullName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Password Changed Successfully</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="success-box">
              <strong>✅ Your password has been changed successfully!</strong>
              <p style="margin: 5px 0 0 0;">Changed on ${new Date().toLocaleString()}.</p>
            </div>

            <div class="warning">
              <strong>⚠️ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">If you didn't make this change, please contact support immediately.</p>
              <p style="text-align: center;">
                <a href="mailto:support@staler.com" class="button">📧 Contact Support</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '✅ Password Changed - S-Taler',
      html,
    });
  }

  async sendNameChangedEmail(email: string, oldName: string, newName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>👤 Name Updated</h1>
          </div>
          <div class="content">
            <p>Hi there,</p>
            
            <div class="info-box">
              <strong>📝 Your account name has been updated</strong>
              <p style="margin: 10px 0 0 0;">
                <strong>Old Name:</strong> ${oldName}<br>
                <strong>New Name:</strong> ${newName}<br>
                <strong>Changed:</strong> ${new Date().toLocaleString()}
              </p>
            </div>

            <div class="warning">
              <strong>⚠️ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">If you didn't make this change, please contact support immediately.</p>
              <p style="text-align: center;">
                <a href="mailto:support@staler.com" class="button">📧 Contact Support</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '👤 Account Name Updated - S-Taler',
      html,
    });
  }

  async sendImageChangedEmail(email: string, fullName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .info-box { background: #f3e5f5; border-left: 4px solid #9c27b0; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📸 Profile Image Updated</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="info-box">
              <strong>🖼️ Your profile image has been updated</strong>
              <p style="margin: 10px 0 0 0;">
                Changed on ${new Date().toLocaleString()}
              </p>
            </div>

            <div class="warning">
              <strong>⚠️ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">If you didn't make this change, please contact support immediately.</p>
              <p style="text-align: center;">
                <a href="mailto:support@staler.com" class="button">📧 Contact Support</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '📸 Profile Image Updated - S-Taler',
      html,
    });
  }

  async sendVerificationReminder(email: string, fullName: string, verificationCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #fa709a; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #fa709a; letter-spacing: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📧 Verification Code</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="code-box">
              <p style="margin: 0; color: #666;">Your Verification Code</p>
              <div class="code">${verificationCode}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '📧 Verification Code - S-Taler',
      html,
    });
  }

  async sendNewEmailWelcome(newEmail: string, fullName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Welcome to S-Taler!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="success-box">
              <strong>✅ Email Updated Successfully!</strong>
              <p style="margin: 10px 0 0 0;">
                Your S-Taler account email has been changed to: <strong>${newEmail}</strong><br>
                Changed on: ${new Date().toLocaleString()}
              </p>
            </div>

            <p>You can now use this email address to:</p>
            <ul>
              <li>🔐 Login to your account</li>
              <li>📧 Receive important notifications</li>
              <li>🔑 Reset your password</li>
            </ul>

            <div class="warning">
              <strong>⚠️ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">
                If you didn't make this change, please contact our support team immediately.
              </p>
              <p style="text-align: center;">
                <a href="mailto:support@staler.com" class="button">📧 Contact Support</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: newEmail,
      subject: '🎉 Email Updated Successfully - S-Taler',
      html,
    });
  }

  async sendProfileUpdateNotification(email: string, fullName: string, changes: { type: string; oldValue?: string; newValue?: string }[]): Promise<boolean> {
    const changesList = changes.map(change => {
      switch (change.type) {
        case 'email':
          return `<li><strong>📧 Email:</strong> ${change.oldValue} → ${change.newValue}</li>`;
        case 'phone':
          return `<li><strong>📱 Phone:</strong> ${change.oldValue || 'Not set'} → ${change.newValue}</li>`;
        case 'password':
          return `<li><strong>🔐 Password:</strong> Changed</li>`;
        case 'name':
          return `<li><strong>👤 Name:</strong> ${change.oldValue} → ${change.newValue}</li>`;
        case 'image':
          return `<li><strong>📸 Profile Image:</strong> Updated</li>`;
        default:
          return '';
      }
    }).filter(Boolean).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .changes-list { background: white; border: 1px solid #ddd; padding: 15px; margin: 15px 0; border-radius: 8px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; padding: 12px 30px; background: #ffc107; color: #333; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Profile Updated</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="success-box">
              <strong>✅ Your profile has been updated successfully!</strong>
              <p style="margin: 5px 0 0 0;">Updated on ${new Date().toLocaleString()}</p>
            </div>

            <p><strong>📝 Changes made:</strong></p>
            <div class="changes-list">
              <ul style="margin: 0; padding-left: 20px;">
                ${changesList}
              </ul>
            </div>

            <div class="warning">
              <strong>⚠️ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">If you didn't make these changes, please contact support immediately.</p>
              <p style="text-align: center;">
                <a href="mailto:support@staler.com" class="button">📧 Contact Support</a>
              </p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '✅ Profile Updated - S-Taler',
      html,
    });
  }

  async sendAccountDeletionCode(email: string, fullName: string, deletionCode: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: white; border: 2px dashed #dc2626; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
          .code { font-size: 32px; font-weight: bold; color: #dc2626; letter-spacing: 5px; }
          .danger-box { background: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Account Deletion Request</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="danger-box">
              <strong>🚨 You requested to delete your S-Taler account</strong>
              <p style="margin: 10px 0 0 0;">
                This action is <strong>PERMANENT</strong> and cannot be undone.<br>
                All your data will be permanently deleted.
              </p>
            </div>

            <p><strong>If this was you:</strong></p>
            <p>Enter the code below to confirm account deletion:</p>

            <div class="code-box">
              <p style="margin: 0; color: #666;">Confirmation Code</p>
              <div class="code">${deletionCode}</div>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">Valid for 15 minutes</p>
            </div>

            <div class="danger-box">
              <strong>❌ Wasn't you?</strong>
              <p style="margin: 5px 0 0 0;">Don't enter the code. Your account will remain active. Consider changing your password immediately.</p>
            </div>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '⚠️ Account Deletion Request - S-Taler',
      html,
    });
  }

  async sendAccountCannotBeDeletedEmail(email: string, fullName: string, reason: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .warning-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .info-box { background: #dbeafe; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚫 Account Deletion Not Possible</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${fullName}</strong>,</p>
            
            <div class="warning-box">
              <strong>⚠️ Your account cannot be deleted at this time</strong>
              <p style="margin: 10px 0 0 0;">
                <strong>Reason:</strong> ${reason}
              </p>
            </div>

            <div class="info-box">
              <strong>📧 Need to delete your account?</strong>
              <p style="margin: 10px 0 0 0;">
                Please contact our support team at <strong>support@staler.com</strong> for assistance.<br>
                Our team will help you resolve any pending issues before account deletion.
              </p>
            </div>

            <p><strong>What you can do:</strong></p>
            <ul>
              <li>📧 Contact support for assistance</li>
              <li>💰 Withdraw your balance to your bank account</li>
              <li>📦 Complete or cancel any pending orders</li>
              <li>🔒 Update your security settings</li>
            </ul>
          </div>
          <div class="footer">
            <p>© 2026 S-Taler. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: '🚫 Account Deletion Not Possible - S-Taler',
      html,
    });
  }
}

export default new EmailService();