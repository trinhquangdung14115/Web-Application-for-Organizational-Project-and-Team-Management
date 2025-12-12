import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send welcome email to new user
 */
export const sendWelcomeEmail = async (to, userName) => {
  const mailOptions = {
    from: `"Project Management Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Welcome to Project Management System!",
    text: `Hi ${userName},

Thank you for joining our Project Management System!

You can now:
- Create and manage projects
- Collaborate with team members
- Track tasks and attendance
- Schedule meetings

Get started: ${process.env.CLIENT_URL || "http://localhost:5173"}

Best regards,
Project Management Team`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Welcome email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (to, userName, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL || "http://localhost:5173"}/reset-password?token=${resetToken}`;

  const mailOptions = {
    from: `"Project Management Team" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Password Reset Request",
    text: `Hi ${userName},

  We received a request to reset your password for your Project Management account.

  Click this link to reset your password:
  ${resetUrl}

  SECURITY NOTICE:
  - This link will expire in 1 hour
  - If you didn't request this, please ignore this email
  - Your password will remain unchanged

  Best regards,
  Project Management Team`,
    };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Password reset email sent to ${to}`);
    return { success: true };
  } catch (error) {
    console.error("❌ Error sending password reset email:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Test email configuration
 */
export const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log("✅ Email service is ready");
    return true;
  } catch (error) {
    console.error("❌ Email service error:", error);
    return false;
  }
};
