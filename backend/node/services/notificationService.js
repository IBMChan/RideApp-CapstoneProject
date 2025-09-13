<<<<<<< HEAD
//laxmikanth: notification(email(smtp) - phone (firebase)) , authentication, updates of rides, invoice download
//to send notifcation on payment completion
=======
import nodemailer from "nodemailer";

const otpStore = new Map();

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const storeOTP = (identifier, otp) => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);

  otpStore.set(identifier, { otp, expiresAt });
  return otp;
};

export const verifyOTP = (identifier, otp) => {
  const storedData = otpStore.get(identifier);
  if (!storedData) return { valid: false, message: "OTP not found or expired" };
  if (new Date() > storedData.expiresAt) {
    otpStore.delete(identifier);
    return { valid: false, message: "OTP expired" };
  }
  if (storedData.otp !== otp) return { valid: false, message: "Invalid OTP" };
  otpStore.delete(identifier);
  return { valid: true, message: "OTP verified successfully" };
};

export const sendEmailOTP = async (email) => {
  try {
    const otp = generateOTP();
    storeOTP(email, otp);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your OTP for RideApp Registration",
      text: `Your OTP for RideApp registration is: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Your OTP for RideApp registration is: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });
    return { success: true, message: "OTP sent to email", otp };
  } catch (error) {
    console.error("Email OTP error:", error);
    return { success: false, message: "Failed to send email OTP" };
  }
};

export const sendSmsOTP = async (phone, email) => {
  // Demo mode: send the phone OTP to email instead of SMS (Twilio removed)
  try {
    const otp = generateOTP();
    storeOTP(phone, otp);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your Phone OTP (sent via Email for Demo)",
      text: `Phone OTP for ${phone}: ${otp}. It will expire in 10 minutes.`,
      html: `<p>Phone OTP for <strong>${phone}</strong>: <strong>${otp}</strong></p><p>It will expire in 10 minutes.</p>`,
    });

    return { success: true, message: "Phone OTP sent to email (demo)", otp };
  } catch (error) {
    console.error("Phone OTP via email error:", error);
    return { success: false, message: "Failed to send phone OTP via email" };
  }
};
>>>>>>> upstream/main
