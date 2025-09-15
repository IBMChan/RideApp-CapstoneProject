import nodemailer from "nodemailer";

const otpStore = new Map();
const OTP_EXPIRY_MINUTES = 10;

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration timestamp in UTC milliseconds, with logging
const storeOTP = (identifier, otp) => {
  const expiresAt = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000; // UTC timestamp in ms
  otpStore.set(identifier, { otp, expiresAt });
  console.log(`[OTP STORE] OTP for '${identifier}' generated: ${otp}, expires at (UTC): ${new Date(expiresAt).toISOString()}`);
  return otp;
};

// Clean expired OTPs periodically with logging
setInterval(() => {
  const now = Date.now();
  for (const [key, { expiresAt }] of otpStore.entries()) {
    if (now > expiresAt) {
      otpStore.delete(key);
      console.log(`[OTP CLEANUP] Expired OTP for '${key}' removed at ${new Date(now).toISOString()}`);
    }
  }
}, 60 * 1000);

export const verifyOTP = (identifier, otp) => {
  const storedData = otpStore.get(identifier);
  if (!storedData) {
    console.log(`[OTP VERIFY] No OTP found for '${identifier}'`);
    return { valid: false, message: "OTP not found or expired" };
  }

  const now = Date.now();
  console.log(`[OTP VERIFY] Verifying OTP for '${identifier}': input = ${otp}, expected = ${storedData.otp}, now = ${new Date(now).toISOString()}, expiresAt = ${new Date(storedData.expiresAt).toISOString()}`);

  if (now > storedData.expiresAt) {
    otpStore.delete(identifier);
    console.log(`[OTP VERIFY] OTP expired for '${identifier}'`);
    return { valid: false, message: "OTP expired" };
  }

  if (storedData.otp !== otp) {
    console.log(`[OTP VERIFY] Invalid OTP for '${identifier}'`);
    return { valid: false, message: "Invalid OTP" };
  }

  otpStore.delete(identifier);
  console.log(`[OTP VERIFY] OTP verified successfully for '${identifier}'`);
  return { valid: true, message: "OTP verified successfully" };
};


const formatExpiryIST = (expiresAt) => {
  // Using toLocaleString with Asia/Kolkata timezone explicitly to format display string
  return expiresAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
};

export const sendEmailOTP = async (email) => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    storeOTP(email, otp);

    const expiryIST = formatExpiryIST(expiresAt);

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
      text: `Your OTP for RideApp registration is: ${otp}. It will expire around ${expiryIST} IST.`,
      html: `<p>Your OTP for RideApp registration is: <strong>${otp}</strong></p><p>It will expire around <strong>${expiryIST}</strong> IST.</p>`,
    });

    return { success: true, message: "OTP sent to email", otp };
  } catch (error) {
    console.error("Email OTP error:", error);
    return { success: false, message: "Failed to send email OTP" };
  }
};

export const sendSmsOTP = async (phone, email) => {
  try {
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);
    storeOTP(phone, otp);

    const expiryIST = formatExpiryIST(expiresAt);

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
      text: `Phone OTP for ${phone}: ${otp}. It will expire around ${expiryIST} IST.`,
      html: `<p>Phone OTP for <strong>${phone}</strong>: <strong>${otp}</strong></p><p>It will expire around <strong>${expiryIST}</strong> IST.</p>`,
    });

    return { success: true, message: "Phone OTP sent to email (demo)", otp };
  } catch (error) {
    console.error("Phone OTP via email error:", error);
    return { success: false, message: "Failed to send phone OTP via email" };
  }
};
