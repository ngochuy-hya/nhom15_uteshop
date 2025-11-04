import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Tạo transporter cho Gmail
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: false, // true cho port 465, false cho port 587
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // Sử dụng App Password cho Gmail
  },
});

// Kiểm tra kết nối email
transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.error('Lỗi cấu hình email:', error);
  } else {
    console.log('Email server đã sẵn sàng gửi tin nhắn');
  }
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email đã gửi thành công:', info.messageId);
    return true;
  } catch (error) {
    console.error('Lỗi gửi email:', error);
    return false;
  }
};

// Template email xác thực OTP
export const generateOTPEmailTemplate = (otp: string, firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Xác thực tài khoản UTESHOP</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .otp-box { background: #007bff; color: white; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; margin: 20px 0; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chào mừng đến với UTESHOP!</h1>
            </div>
            <div class="content">
                <h2>Xin chào ${firstName}!</h2>
                <p>Cảm ơn bạn đã đăng ký tài khoản tại UTESHOP. Để hoàn tất việc đăng ký, vui lòng sử dụng mã OTP bên dưới:</p>
                
                <div class="otp-box">
                    ${otp}
                </div>
                
                <p><strong>Lưu ý:</strong></p>
                <ul>
                    <li>Mã OTP có hiệu lực trong <strong>15 phút</strong></li>
                    <li>Không chia sẻ mã này với bất kỳ ai</li>
                    <li>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này</li>
                </ul>
                
                <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi qua email: <a href="mailto:support@uteshop.com">support@uteshop.com</a></p>
            </div>
            <div class="footer">
                <p>© 2024 UTESHOP. Tất cả quyền được bảo lưu.</p>
                <p>Email này được gửi tự động, vui lòng không trả lời.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};

// Template email chào mừng sau khi xác thực
export const generateWelcomeEmailTemplate = (firstName: string): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Chào mừng đến với UTESHOP!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .cta-button { display: inline-block; background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Chào mừng ${firstName}!</h1>
            </div>
            <div class="content">
                <h2>Tài khoản của bạn đã được xác thực thành công!</h2>
                <p>Bây giờ bạn có thể:</p>
                <ul>
                    <li>🛍️ Mua sắm hàng nghìn sản phẩm thời trang</li>
                    <li>💝 Thêm sản phẩm vào wishlist</li>
                    <li>📦 Theo dõi đơn hàng dễ dàng</li>
                    <li>⭐ Đánh giá sản phẩm</li>
                    <li>🎁 Nhận ưu đãi độc quyền</li>
                </ul>
                
                <div style="text-align: center;">
                    <a href="${process.env.CORS_ORIGIN}" class="cta-button">Bắt đầu mua sắm ngay!</a>
                </div>
                
                <p>Chúc bạn có những trải nghiệm mua sắm tuyệt vời tại UTESHOP!</p>
            </div>
            <div class="footer">
                <p>© 2024 UTESHOP. Tất cả quyền được bảo lưu.</p>
            </div>
        </div>
    </body>
    </html>
  `;
};
