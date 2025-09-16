import nodemailer from "nodemailer";
// Add this function to notificationService.js
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit'; // We'll need to install this

export const sendRideCompletionEmail = async (riderEmail, rideDetails, driverDetails) => {
  try {
    // Create a temporary file path for the PDF
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const pdfPath = path.join(tempDir, `receipt_${rideDetails.ride_id}.pdf`);
    
    // Generate the PDF receipt
    await generateReceiptPDF(pdfPath, rideDetails, driverDetails);
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Format the pickup and drop locations
    const pickup = typeof rideDetails.pickup_loc === 'string' 
      ? JSON.parse(rideDetails.pickup_loc) 
      : rideDetails.pickup_loc;
    
    const drop = typeof rideDetails.drop_loc === 'string' 
      ? JSON.parse(rideDetails.drop_loc) 
      : rideDetails.drop_loc;

    // Format the ride date
    const rideDate = new Date(rideDetails.ride_date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });
    
    // Format the completion date
    const completionDate = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: riderEmail,
      subject: "Your Ride Receipt - Thank You for Riding with Us!",
      text: `
        Thank you for choosing RideApp!
        
        Your ride has been completed successfully.
        
        Ride Details:
        - Ride ID: ${rideDetails.ride_id}
        - Date: ${rideDate}
        - Pickup Location: ${pickup.lat}, ${pickup.lng}
        - Drop Location: ${drop.lat}, ${drop.lng}
        - Distance: ${rideDetails.distance} km
        - Fare: ₹${rideDetails.fare}
        - Completion Time: ${completionDate}
        
        Driver Details:
        - Name: ${driverDetails.full_name}
        
        Your receipt is attached to this email.
        
        We hope you enjoyed your ride! Please rate your experience in the app.
        
        Thank you for using RideApp!
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4a90e2;">Thank You for Riding with Us!</h1>
            <p style="font-size: 16px; color: #666;">Your ride has been completed successfully.</p>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Ride Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; width: 40%;"><strong>Ride ID:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${rideDetails.ride_id}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${rideDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Pickup Location:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${pickup.lat}, ${pickup.lng}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Drop Location:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${drop.lat}, ${drop.lng}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Distance:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;">${rideDetails.distance} km</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Fare:</strong></td>
                <td style="padding: 8px 0; border-bottom: 1px solid #eee; font-weight: bold; color: #4a90e2;">₹${rideDetails.fare}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0;"><strong>Completion Time:</strong></td>
                <td style="padding: 8px 0;">${completionDate}</td>
              </tr>
            </table>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <h2 style="color: #333; margin-top: 0;">Driver Details</h2>
            <p><strong>Name:</strong> ${driverDetails.full_name}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <p>Your receipt is attached to this email.</p>
            <p style="margin-top: 20px; color: #666;">We hope you enjoyed your ride! Please rate your experience in the app.</p>
            <p style="margin-top: 30px; font-size: 14px; color: #999;">Thank you for using RideApp!</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            <p style="font-size: 12px; color: #999;">
              © ${new Date().getFullYear()} RideApp. All rights reserved.<br>
              For support, contact us at support@rideapp.com
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: `RideApp_Receipt_${rideDetails.ride_id}.pdf`,
          path: pdfPath,
          contentType: 'application/pdf'
        }
      ]
    });

    // Delete the temporary PDF file
    fs.unlinkSync(pdfPath);

    console.log(`Ride completion email with receipt sent to ${riderEmail}`);
    return { success: true, message: "Ride completion email with receipt sent" };
  } catch (error) {
    console.error("Ride completion email error:", error);
    return { success: false, message: "Failed to send ride completion email" };
  }
};

// Function to generate a PDF receipt
const generateReceiptPDF = async (filePath, rideDetails, driverDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Format the pickup and drop locations
      const pickup = typeof rideDetails.pickup_loc === 'string' 
        ? JSON.parse(rideDetails.pickup_loc) 
        : rideDetails.pickup_loc;
      
      const drop = typeof rideDetails.drop_loc === 'string' 
        ? JSON.parse(rideDetails.drop_loc) 
        : rideDetails.drop_loc;

      // Format the ride date
      const rideDate = new Date(rideDetails.ride_date).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short'
      });
      
      // Header
      doc.fontSize(25).text('RideApp Receipt', { align: 'center' });
      doc.moveDown();
      
      // Add a decorative line
      doc.strokeColor('#4a90e2').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      
      // Ride details section
      doc.fontSize(16).fillColor('#333').text('Ride Details', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12).fillColor('#666');
      doc.text(`Ride ID: ${rideDetails.ride_id}`);
      doc.text(`Date: ${rideDate}`);
      doc.text(`Pickup Location: ${pickup.lat}, ${pickup.lng}`);
      doc.text(`Drop Location: ${drop.lat}, ${drop.lng}`);
      doc.text(`Distance: ${rideDetails.distance} km`);
      doc.fontSize(14).fillColor('#4a90e2').text(`Fare: ₹${rideDetails.fare}`, { bold: true });
      doc.moveDown();
      
      // Driver details section
      doc.fontSize(16).fillColor('#333').text('Driver Details', { underline: true });
      doc.moveDown();
      
      doc.fontSize(12).fillColor('#666');
      doc.text(`Name: ${driverDetails.full_name}`);
      doc.moveDown(2);
      
      // Add a quote
      doc.fontSize(12).fillColor('#999').text('Thank you for choosing RideApp for your journey!', { align: 'center', italic: true });
      doc.moveDown();
      doc.text('We hope to see you again soon.', { align: 'center', italic: true });
      doc.moveDown(2);
      
      // Footer
      doc.fontSize(10).fillColor('#999').text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, { align: 'center' });
      doc.text('© RideApp. All rights reserved.', { align: 'center' });
      
      // Finalize the PDF
      doc.end();
      
      writeStream.on('finish', () => {
        resolve();
      });
      
      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};






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

// Add this function to notificationService.js
// Updated sendRideAcceptanceEmail function
export const sendRideAcceptanceEmail = async (riderEmail, rideDetails, vehicleDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Format the pickup and drop locations
    const pickup = typeof rideDetails.pickup_loc === 'string' 
      ? JSON.parse(rideDetails.pickup_loc) 
      : rideDetails.pickup_loc;
    
    const drop = typeof rideDetails.drop_loc === 'string' 
      ? JSON.parse(rideDetails.drop_loc) 
      : rideDetails.drop_loc;

    // Format the ride date
    const rideDate = new Date(rideDetails.ride_date).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short'
    });

    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: riderEmail,
      subject: "Your Ride Has Been Accepted!",
      text: `
        Good news! Your ride has been accepted by a driver.
        
        Vehicle Details:
        - Model: ${vehicleDetails.model}
        - Make: ${vehicleDetails.make}
        - Plate Number: ${vehicleDetails.plate_no}
        - Color: ${vehicleDetails.color}
        
        Ride Details:
        - Pickup Location: ${pickup.lat}, ${pickup.lng}
        - Drop Location: ${drop.lat}, ${drop.lng}
        - Distance: ${rideDetails.distance} km
        - Fare: ₹${rideDetails.fare}
        - Ride Date: ${rideDate}
        
        Your OTP for this ride: ${rideDetails.ride_pin}
        Please share this OTP with the driver when they arrive to start your ride.
        
        Thank you for using RideApp!
      `,
      html: `
        <h2>Good news! Your ride has been accepted by a driver.</h2>
        
        <h3>Vehicle Details:</h3>
        <ul>
          <li><strong>Model:</strong> ${vehicleDetails.model}</li>
          <li><strong>Make:</strong> ${vehicleDetails.make}</li>
          <li><strong>Plate Number:</strong> ${vehicleDetails.plate_no}</li>
          <li><strong>Color:</strong> ${vehicleDetails.color}</li>
        </ul>
        
        <h3>Ride Details:</h3>
        <ul>
          <li><strong>Pickup Location:</strong> ${pickup.lat}, ${pickup.lng}</li>
          <li><strong>Drop Location:</strong> ${drop.lat}, ${drop.lng}</li>
          <li><strong>Distance:</strong> ${rideDetails.distance} km</li>
          <li><strong>Fare:</strong> ₹${rideDetails.fare}</li>
          <li><strong>Ride Date:</strong> ${rideDate}</li>
        </ul>
        
        <h3 style="color: #e74c3c;">Your OTP for this ride: <span style="font-size: 1.2em;">${rideDetails.ride_pin}</span></h3>
        <p>Please share this OTP with the driver when they arrive to start your ride.</p>
        
        <p>Thank you for using RideApp!</p>
      `,
    });

    console.log(`Ride acceptance email sent to ${riderEmail}`);
    return { success: true, message: "Ride acceptance email sent" };
  } catch (error) {
    console.error("Ride acceptance email error:", error);
    return { success: false, message: "Failed to send ride acceptance email" };
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

// Add this function to notificationService.js
export const sendRideStatusChangeEmail = async (riderEmail, rideDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Format the pickup and drop locations
    const pickup = typeof rideDetails.pickup_loc === 'string' 
      ? JSON.parse(rideDetails.pickup_loc) 
      : rideDetails.pickup_loc;
    
    const drop = typeof rideDetails.drop_loc === 'string' 
      ? JSON.parse(rideDetails.drop_loc) 
      : rideDetails.drop_loc;

    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: riderEmail,
      subject: "Your Ride Status Has Changed",
      text: `
        Your ride status has changed from accepted to ongoing.
        
        Ride Details:
        - Pickup Location: ${pickup.lat}, ${pickup.lng}
        - Drop Location: ${drop.lat}, ${drop.lng}
        
        Thank you for using RideApp!
      `,
      html: `
        <h2>Your ride status has changed from accepted to ongoing.</h2>
        
        <h3>Ride Details:</h3>
        <ul>
          <li><strong>Pickup Location:</strong> ${pickup.lat}, ${pickup.lng}</li>
          <li><strong>Drop Location:</strong> ${drop.lat}, ${drop.lng}</li>
        </ul>
        
        <p>Thank you for using RideApp!</p>
      `,
    });

    console.log(`Ride status change email sent to ${riderEmail}`);
    return { success: true, message: "Ride status change email sent" };
  } catch (error) {
    console.error("Ride status change email error:", error);
    return { success: false, message: "Failed to send ride status change email" };
  }
};

// Add this function to notificationService.js after sendRideStatusChangeEmail
export const sendRideRequestToDriver = async (driverEmail, rideDetails, riderDetails) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });

    // Format the pickup and drop locations
    const pickup = typeof rideDetails.pickup_loc === 'string' 
      ? JSON.parse(rideDetails.pickup_loc) 
      : rideDetails.pickup_loc;
    
    const drop = typeof rideDetails.drop_loc === 'string' 
      ? JSON.parse(rideDetails.drop_loc) 
      : rideDetails.drop_loc;

    await transporter.sendMail({
      from: `"RideApp" <${process.env.SMTP_USER}>`,
      to: driverEmail,
      subject: "New Ride Request Available!",
      text: `
        You have a new ride request!
        
        Rider Details:
        - Name: ${riderDetails.full_name}
        
        Ride Details:
        - Pickup Location: ${pickup.lat}, ${pickup.lng}
        - Drop Location: ${drop.lat}, ${drop.lng}
        - Distance: ${rideDetails.distance} km
        - Fare: ₹${rideDetails.fare}
        
        Please log in to the app to accept or dismiss this ride request.
        
        Thank you for using RideApp!
      `,
      html: `
        <h2>You have a new ride request!</h2>
        
        <h3>Rider Details:</h3>
        <ul>
          <li><strong>Name:</strong> ${riderDetails.full_name}</li>
        </ul>
        
        <h3>Ride Details:</h3>
        <ul>
          <li><strong>Pickup Location:</strong> ${pickup.lat}, ${pickup.lng}</li>
          <li><strong>Drop Location:</strong> ${drop.lat}, ${drop.lng}</li>
          <li><strong>Distance:</strong> ${rideDetails.distance} km</li>
          <li><strong>Fare:</strong> ₹${rideDetails.fare}</li>
        </ul>
        
        <p>Please log in to the app to <strong style="color: green;">accept</strong> or <strong style="color: red;">dismiss</strong> this ride request.</p>
        
        <p>Thank you for using RideApp!</p>
      `,
    });

    console.log(`Ride request email sent to driver ${driverEmail}`);
    return { success: true, message: "Ride request email sent to driver" };
  } catch (error) {
    console.error("Ride request email error:", error);
    return { success: false, message: "Failed to send ride request email to driver" };
  }
};




