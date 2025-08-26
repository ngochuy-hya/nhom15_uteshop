import nodemailer from 'nodemailer';

// Tạo transporter với cấu hình email
const createTransporter = () => {
  const emailHost = process.env.EMAIL_HOST;
  const emailPort = process.env.EMAIL_PORT;
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailHost || !emailPort || !emailUser || !emailPass) {
    throw new Error('Thiếu cấu hình email trong environment variables');
  }

  return nodemailer.createTransport({
    host: emailHost,
    port: parseInt(emailPort),
    secure: false, // true for 465, false for other ports
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendOTPEmail = async (
  email: string, 
  otp: string, 
  type: 'register' | 'forgot-password'
): Promise<void> => {
  try {
    const transporter = createTransporter();
    
    const subject = type === 'register' 
      ? '🔐 Xác thực đăng ký tài khoản UTEShop' 
      : '🔑 Đặt lại mật khẩu UTEShop';

    const html = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; background-color: #f9fafb;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">UTEShop</h1>
        </div>
        
        <div style="padding: 40px 30px; background-color: white;">
          <h2 style="color: #374151; margin-bottom: 20px; text-align: center;">${subject}</h2>
          
          ${type === 'register' 
            ? '<p style="color: #6b7280; line-height: 1.6;">Cảm ơn bạn đã đăng ký tài khoản UTEShop! Vui lòng sử dụng mã OTP bên dưới để xác thực tài khoản của bạn:</p>'
            : '<p style="color: #6b7280; line-height: 1.6;">Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Vui lòng sử dụng mã OTP bên dưới:</p>'
          }
          
          <div style="background-color: #f3f4f6; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px; border-left: 4px solid #667eea;">
            <div style="font-size: 36px; font-weight: bold; color: #1f2937; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; margin: 20px 0;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⚠️ <strong>Lưu ý:</strong> Mã OTP này có hiệu lực trong <strong>5 phút</strong>. Vui lòng không chia sẻ mã này với bất kỳ ai.
            </p>
          </div>
          
          <p style="color: #6b7280; line-height: 1.6; margin-top: 30px;">
            Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.
          </p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © 2024 UTEShop. Tất cả quyền được bảo lưu.
            </p>
          </div>
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"UTEShop Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);

  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email. Vui lòng thử lại sau.');
  }
};

export const generateOTP = (): string => {
  // Tạo mã OTP 6 số ngẫu nhiên
  return Math.floor(100000 + Math.random() * 900000).toString();
};