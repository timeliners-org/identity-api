// src/services/emailService.ts
import nodemailer from 'nodemailer'
import { randomBytes } from 'crypto'

// Email Transporter konfigurieren
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports (587 uses STARTTLS)
  requireTLS: true, // Erzwingt TLS für Ionos
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // Für Ionos SMTP-Server
    ciphers: 'SSLv3',
    rejectUnauthorized: false // Only for development, should be true in production
  },
  debug: false, // Enables debug logs
  logger: true // Enables logger
})

export class EmailService {
  static generateVerificationToken(): string {
    return randomBytes(32).toString('hex')
  }

  static async testConnection(): Promise<boolean> {
    try {
      await transporter.verify()
      console.log('SMTP connection successfully tested')
      return true
    } catch (error) {
      console.error('SMTP connection test failed:', error)
      return false
    }
  }

  static async sendVerificationEmail(email: string, token: string, username: string): Promise<boolean> {
    const verificationUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@identity-server.com',
      to: email,
      subject: 'Email Verification - Identity Server',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${username}!</h2>
          <p>Thank you for registering. Please verify your email address by clicking the following link:</p>
          <div style="margin: 20px 0;">
            <a href="${verificationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify email
            </a>
          </div>
          <p>Or copy this link into your browser:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${verificationUrl}
          </p>
          <p><strong>Note:</strong> This link is valid for 24 hours.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6c757d; font-size: 12px;">
            If you did not register, you can ignore this email.
          </p>
        </div>
      `,
      text: `
        Welcome, ${username}!
        
        Thank you for registering. Please verify your email address using the following link:
        ${verificationUrl}
        
        Note: This link is valid for 24 hours.
        
        If you did not register, you can ignore this email.
      `
    }

    try {
      const info = await transporter.sendMail(mailOptions)
      console.log('Verification email successfully sent:', info.messageId)
      return true
    } catch (error) {
      console.error('Error sending verification email:', error)
      console.error('SMTP configuration:', {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER ? 'SET' : 'NOT SET',
        pass: process.env.SMTP_PASS ? 'SET' : 'NOT SET'
      })
      return false
    }
  }

  static async sendPasswordResetEmail(email: string, token: string, username: string): Promise<boolean> {
    const resetUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@identity-server.com',
      to: email,
      subject: 'Password Reset - Identity Server',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset</h2>
          <p>Hello ${username},</p>
          <p>You have requested a password reset. Click the following link to set a new password:</p>
          <div style="margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset password
            </a>
          </div>
          <p>Or copy this link into your browser:</p>
          <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            ${resetUrl}
          </p>
          <p><strong>Note:</strong> This link is valid for 1 hour.</p>
          <hr style="margin: 20px 0;">
          <p style="color: #6c757d; font-size: 12px;">
            If you did not request this, you can ignore this email.
          </p>
        </div>
      `,
      text: `
        Password reset
        
        Hello ${username},
        
        You have requested a password reset. Reset your password using the following link:
        ${resetUrl}
        
        Note: This link is valid for 1 hour.
        
        If you did not request this, you can ignore this email.
      `
    }

    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (error) {
      console.error('Error sending password reset email:', error)
      return false
    }
  }
}
