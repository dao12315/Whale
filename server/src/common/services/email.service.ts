/**
 * Email Service - Whale / GGC Studio
 * Xử lý gửi email thực tế qua tài khoản Google SMTP (nguyendao512004@gmail.com)
 * Tự động gửi mật khẩu khởi tạo cho người dùng khi đăng nhập Google lần đầu
 */

import nodemailer, { type Transporter } from 'nodemailer';
import { ENV } from '../../config/env.js';

export interface SentEmailRecord {
  id: string;
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  sentAt: Date;
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  messageId?: string;
  errorMessage?: string;
}

export class EmailService {
  private static sentEmails: SentEmailRecord[] = [];
  private static transporter: Transporter | null = null;

  /**
   * Khởi tạo Transporter kết nối trực tiếp đến máy chủ SMTP của Gmail
   * Sử dụng tài khoản: nguyendao512004@gmail.com
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: ENV.SMTP_HOST || 'smtp.gmail.com',
        port: ENV.SMTP_PORT || 465,
        secure: ENV.SMTP_SECURE, // true for 465, false for other ports
        auth: {
          user: ENV.SMTP_USER || 'nguyendao512004@gmail.com',
          pass: ENV.SMTP_PASS || 'Dao512004@',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Gửi email thông báo tạo tài khoản Google và mật khẩu ngẫu nhiên đã được mã hóa
   * Gửi từ nguyendao512004@gmail.com tới hòm thư người dùng
   */
  static async sendGoogleAccountCreatedEmail(
    toEmail: string,
    displayName: string,
    generatedPassword: string
  ): Promise<SentEmailRecord> {
    const fromSender = `"${ENV.SMTP_FROM_NAME || 'GGC Studio & Whale'}" <${ENV.SMTP_USER || 'nguyendao512004@gmail.com'}>`;
    const subject = '🎉 Chào mừng đến với Whale / GGC Studio - Thông tin tài khoản Google của bạn';
    const bodyText = `
Xin chào ${displayName},

Tài khoản của bạn đã được khởi tạo tự động thông qua đăng nhập Google tại Whale (GGC Studio).

Thông tin tài khoản đăng nhập:
- Email đăng nhập: ${toEmail}
- Mật khẩu khởi tạo: ${generatedPassword}
- Vai trò tài khoản: USER (Học viên)
- Hạn dùng phiên đăng nhập: 24 giờ (Tự động gia hạn)

LƯU Ý BẢO MẬT:
Mật khẩu của bạn đã được băm mã hóa an toàn trong cơ sở dữ liệu.
Bạn có thể sử dụng mật khẩu này để đăng nhập trực tiếp bằng Email/Mật khẩu hoặc luôn sử dụng nút "Đăng nhập bằng Google".
Vui lòng đổi mật khẩu trong phần Cài đặt tài khoản nếu muốn tăng cường bảo mật.

Trân trọng,
Đội ngũ Quản trị GGC Studio & Whale Platform
(Email gửi tự động từ hệ thống: ${ENV.SMTP_USER || 'nguyendao512004@gmail.com'})
    `.trim();

    const bodyHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0c181e; color: #f1f5f9; padding: 24px; border-radius: 16px; border: 1px solid #1e3a4b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #f59e0b; margin: 0; font-size: 24px; letter-spacing: 1px;">GGC STUDIO</h1>
          <p style="color: #94a3b8; font-size: 13px; margin: 4px 0 0 0;">Nền tảng CG Masterclasses & Digital Art</p>
        </div>
        
        <div style="background: #13232d; padding: 20px; border-radius: 12px; border: 1px solid #233b47;">
          <h2 style="color: #38bdf8; font-size: 18px; margin-top: 0;">Chào mừng ${displayName}! 👋</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">
            Tài khoản của bạn vừa được kích hoạt thành công qua <strong>Đăng nhập Google</strong>.
          </p>
          
          <div style="background: #091318; padding: 16px; border-radius: 8px; border: 1px dashed #f59e0b; margin: 16px 0;">
            <p style="margin: 6px 0; font-size: 14px;"><strong>📧 Email đăng nhập:</strong> <span style="color: #f59e0b; font-weight: bold;">${toEmail}</span></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>🔑 Mật khẩu khởi tạo:</strong> <code style="background: #1e293b; padding: 4px 10px; border-radius: 6px; color: #10b981; font-size: 15px; font-weight: bold;">${generatedPassword}</code></p>
            <p style="margin: 6px 0; font-size: 14px;"><strong>🛡️ Vai trò:</strong> <span style="color: #38bdf8; font-weight: bold;">USER (Học viên)</span></p>
          </div>

          <p style="color: #94a3b8; font-size: 12px; line-height: 1.6;">
            * Mật khẩu trên đã được hệ thống mã hóa và lưu trữ an toàn trong cơ sở dữ liệu. Bạn có thể sử dụng mật khẩu này để đăng nhập trực tiếp hoặc tiếp tục sử dụng nút "Đăng nhập bằng Google".
          </p>
        </div>

        <div style="text-align: center; margin-top: 24px; color: #64748b; font-size: 11px;">
          <p>© 2026 Whale / GGC Studio. Mail được gửi tự động từ <strong>${ENV.SMTP_USER || 'nguyendao512004@gmail.com'}</strong>.</p>
        </div>
      </div>
    `;

    let messageId: string | undefined;
    let errorMessage: string | undefined;
    let status: 'SENT' | 'SIMULATED' | 'FAILED' = 'SENT';

    try {
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from: fromSender,
        to: toEmail,
        subject,
        text: bodyText,
        html: bodyHtml,
      });
      messageId = info.messageId;
      console.log(`[EMAIL SERVICE] ✅ Đã gửi email thực tế thành công qua tài khoản ${ENV.SMTP_USER || 'nguyendao512004@gmail.com'} tới ${toEmail}`);
      console.log(`[EMAIL SERVICE] -> Message ID: ${messageId}`);
    } catch (err: any) {
      errorMessage = err?.message || 'Lỗi gửi email SMTP';
      status = 'SIMULATED';
      console.warn(`[EMAIL SERVICE] ⚠️ Không thể chuyển thư qua SMTP Google (${ENV.SMTP_USER}):`, errorMessage);
      if (errorMessage && (errorMessage.includes('534') || errorMessage.includes('535') || errorMessage.includes('Application-specific password') || errorMessage.includes('Username and Password not accepted') || errorMessage.includes('BadCredentials'))) {
        console.warn(`[EMAIL SERVICE] 💡 Lưu ý tài khoản Gmail ${ENV.SMTP_USER}: Do chính sách bảo mật Google (2-Step Verification), bạn có thể cần tạo "Mật khẩu ứng dụng" (App Password 16 ký tự) tại https://myaccount.google.com/apppasswords để cấp quyền truy cập SMTP trực tiếp.`);
      }
    }

    const record: SentEmailRecord = {
      id: `mail_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      to: toEmail,
      subject,
      bodyText,
      bodyHtml,
      sentAt: new Date(),
      status,
      messageId,
      errorMessage,
    };

    this.sentEmails.push(record);
    console.log(`[EMAIL SERVICE] 📋 Nhật ký gửi mail: To: ${toEmail} | Mật khẩu cấp: ${generatedPassword} | Status: ${status}`);

    return record;
  }

  static getSentEmails(): SentEmailRecord[] {
    return this.sentEmails;
  }
}
