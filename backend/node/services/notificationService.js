//laxmikanth: notification(email(smtp) - phone (firebase)) , authentication, updates of rides, invoice download
//to send notifcation on payment completion
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
// const generateReceiptPDF = async (filePath, rideDetails, driverDetails) => {
//   return new Promise((resolve, reject) => {
//     try {
//       const doc = new PDFDocument({ margin: 50 });
//       const writeStream = fs.createWriteStream(filePath);
      
//       doc.pipe(writeStream);
      
//       // Format the pickup and drop locations
//       const pickup = typeof rideDetails.pickup_loc === 'string' 
//         ? JSON.parse(rideDetails.pickup_loc) 
//         : rideDetails.pickup_loc;
      
//       const drop = typeof rideDetails.drop_loc === 'string' 
//         ? JSON.parse(rideDetails.drop_loc) 
//         : rideDetails.drop_loc;

//       // Format the ride date
//       const rideDate = new Date(rideDetails.ride_date).toLocaleString('en-IN', {
//         timeZone: 'Asia/Kolkata',
//         dateStyle: 'medium',
//         timeStyle: 'short'
//       });
      
//       // Header
//       doc.fontSize(25).text('RideApp Receipt', { align: 'center' });
//       doc.moveDown();
      
//       // Add a decorative line
//       doc.strokeColor('#4a90e2').lineWidth(2).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
//       doc.moveDown();
      
//       // Ride details section
//       doc.fontSize(16).fillColor('#333').text('Ride Details', { underline: true });
//       doc.moveDown();
      
//       doc.fontSize(12).fillColor('#666');
//       doc.text(`Ride ID: ${rideDetails.ride_id}`);
//       doc.text(`Date: ${rideDate}`);
//       doc.text(`Pickup Location: ${pickup.lat}, ${pickup.lng}`);
//       doc.text(`Drop Location: ${drop.lat}, ${drop.lng}`);
//       doc.text(`Distance: ${rideDetails.distance} km`);
//       doc.fontSize(14).fillColor('#4a90e2').text(`Fare: ₹${rideDetails.fare}`, { bold: true });
//       doc.moveDown();
      
//       // Driver details section
//       doc.fontSize(16).fillColor('#333').text('Driver Details', { underline: true });
//       doc.moveDown();
      
//       doc.fontSize(12).fillColor('#666');
//       doc.text(`Name: ${driverDetails.full_name}`);
//       doc.moveDown(2);
      
//       // Add a quote
//       doc.fontSize(12).fillColor('#999').text('Thank you for choosing RideApp for your journey!', { align: 'center', italic: true });
//       doc.moveDown();
//       doc.text('We hope to see you again soon.', { align: 'center', italic: true });
//       doc.moveDown(2);
      
//       // Footer
//       doc.fontSize(10).fillColor('#999').text(`Generated on: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`, { align: 'center' });
//       doc.text('© RideApp. All rights reserved.', { align: 'center' });
      
//       // Finalize the PDF
//       doc.end();
      
//       writeStream.on('finish', () => {
//         resolve();
//       });
      
//       writeStream.on('error', (err) => {
//         reject(err);
//       });
//     } catch (error) {
//       reject(error);
//     }
//   });
// };

const generateReceiptPDF = async (filePath, rideDetails, driverDetails) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 30,
        size: 'A4',
        info: {
          Title: 'RideApp Receipt',
          Author: 'RideApp',
          Subject: `Receipt for Ride ${rideDetails.ride_id}`
        }
      });
      
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);
      
      // Color scheme - Professional and modern
      const colors = {
        primary: '#2C5282',      // Deep blue
        secondary: '#4299E1',    // Medium blue
        accent: '#38B2AC',       // Teal
        success: '#48BB78',      // Green
        text: {
          primary: '#2D3748',    // Dark gray
          secondary: '#718096',  // Medium gray
          light: '#A0AEC0'       // Light gray
        },
        background: {
          light: '#F7FAFC',      // Very light blue-gray
          medium: '#EDF2F7'      // Light gray
        }
      };
      
      // Parse location data
      const pickup = typeof rideDetails.pickup_loc === 'string' 
        ? JSON.parse(rideDetails.pickup_loc) 
        : rideDetails.pickup_loc;
      
      const drop = typeof rideDetails.drop_loc === 'string' 
        ? JSON.parse(rideDetails.drop_loc) 
        : rideDetails.drop_loc;
      
      // Format ride date with enhanced formatting
      const rideDate = new Date(rideDetails.ride_date);
      const formattedDate = rideDate.toLocaleDateString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'Asia/Kolkata'
      });
      
      const formattedTime = rideDate.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Kolkata'
      });
      
      let currentY = 30;
      
      // Header Section with Professional Branding (Reduced height)
      const headerHeight = 60;
      doc.rect(0, 0, doc.page.width, headerHeight)
         .fillAndStroke(colors.primary, colors.primary);
      
      // Ride App Logo (Car icon using text)
      doc.fontSize(24)
         .fillColor('white')
         .text('🚗', 50, 20);
      
      // Company Header
      doc.fontSize(22)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('RideApp', 80, 18);
      
      doc.fontSize(10)
         .fillColor(colors.background.light)
         .font('Helvetica')
         .text('Professional Ride Services', 80, 40);
      
      // Receipt Title and ID
      doc.fontSize(14)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('RIDE RECEIPT', doc.page.width - 130, 18, { align: 'right', width: 100 });
      
      doc.fontSize(10)
         .fillColor(colors.background.light)
         .font('Helvetica')
         .text(`#${rideDetails.ride_id}`, doc.page.width - 130, 35, { align: 'right', width: 100 });
      
      currentY = headerHeight + 20;
      
      // Trip Summary Card (Reduced height)
      const cardHeight = 70;
      
      doc.rect(50, currentY, doc.page.width - 100, cardHeight)
         .fillAndStroke(colors.background.light, colors.secondary)
         .lineWidth(1);
      
      // Trip Status Badge
      doc.rect(60, currentY + 10, 70, 20)
         .fillAndStroke(colors.success, colors.success)
         .fontSize(9)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('COMPLETED', 65, currentY + 18);
      
      // Trip Date and Time
      doc.fontSize(12)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text(formattedDate, 60, currentY + 40);
      
      doc.fontSize(10)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text(`at ${formattedTime}`, 60, currentY + 55);
      
      // Trip Distance (right side of card)
      doc.fontSize(10)
         .fillColor(colors.text.secondary)
         .text('Distance', doc.page.width - 120, currentY + 40);
      
      doc.fontSize(14)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text(`${rideDetails.distance} km`, doc.page.width - 120, currentY + 52);
      
      currentY += cardHeight + 25;
      
      // Route Information Section (Compact)
      doc.fontSize(14)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text('Trip Route', 50, currentY);
      
      currentY += 20;
      
      // Pickup Location
      const locationY = currentY;
      
      // Pickup dot
      doc.circle(60, locationY + 5, 4)
         .fillAndStroke(colors.success, colors.success);
      
      doc.fontSize(10)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text('PICKUP', 75, locationY);
      
      doc.fontSize(11)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text(`${pickup.lat}, ${pickup.lng}`, 75, locationY + 12);
      
      // Connection line
      doc.moveTo(60, locationY + 15)
         .lineTo(60, locationY + 35)
         .stroke(colors.text.light);
      
      // Drop-off dot
      doc.circle(60, locationY + 40, 4)
         .fillAndStroke(colors.primary, colors.primary);
      
      doc.fontSize(10)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text('DROP-OFF', 75, locationY + 35);
      
      doc.fontSize(11)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text(`${drop.lat}, ${drop.lng}`, 75, locationY + 47);
      
      currentY += 75;
      
      // Driver Information Section (Compact)
      doc.fontSize(14)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text('Driver Details', 50, currentY);
      
      currentY += 18;
      
      // Driver card (Reduced height)
      doc.rect(50, currentY, doc.page.width - 100, 50)
         .fillAndStroke(colors.background.medium, colors.text.light)
         .lineWidth(1);
      
      // Driver avatar placeholder
      doc.circle(70, currentY + 25, 15)
         .fillAndStroke(colors.secondary, colors.secondary);
      
      doc.fontSize(8)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('👤', 66, currentY + 21);
      
      // Driver name and info
      doc.fontSize(12)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text(driverDetails.full_name, 95, currentY + 15);
      
      doc.fontSize(9)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text('Professional Driver', 95, currentY + 30);
      
      // Rating stars (compact)
      const starY = currentY + 42;
      for (let i = 0; i < 5; i++) {
        doc.fontSize(8)
           .fillColor(colors.accent)
           .text('★', 95 + (i * 10), starY);
      }
      
      doc.fontSize(8)
         .fillColor(colors.text.secondary)
         .text('4.8', 145, starY);
      
      currentY += 70;
      
      // Payment Summary Section (Compact)
      doc.fontSize(14)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text('Payment Summary', 50, currentY);
      
      currentY += 20;
      
      // Payment details card (Reduced height)
      const paymentCardHeight = 90;
      doc.rect(50, currentY, doc.page.width - 100, paymentCardHeight)
         .fillAndStroke(colors.background.light, colors.text.light)
         .lineWidth(1);
      
      const paymentY = currentY + 15;
      
      // Base fare
      doc.fontSize(11)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text('Base Fare', 65, paymentY);
      
      doc.fontSize(11)
         .fillColor(colors.text.primary)
         .text(`₹${(parseFloat(rideDetails.fare) * 0.7).toFixed(2)}`, doc.page.width - 110, paymentY);
      
      // Distance fare
      doc.text('Distance Charge', 65, paymentY + 15);
      doc.text(`₹${(parseFloat(rideDetails.fare) * 0.25).toFixed(2)}`, doc.page.width - 110, paymentY + 15);
      
      // Time fare
      doc.text('Time Charge', 65, paymentY + 30);
      doc.text(`₹${(parseFloat(rideDetails.fare) * 0.05).toFixed(2)}`, doc.page.width - 110, paymentY + 30);
      
      // Separator line
      doc.moveTo(65, paymentY + 45)
         .lineTo(doc.page.width - 65, paymentY + 45)
         .stroke(colors.text.light);
      
      // Total fare with highlight
      doc.rect(55, paymentY + 50, doc.page.width - 110, 25)
         .fillAndStroke(colors.primary, colors.primary);
      
      doc.fontSize(12)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('Total Fare', 70, paymentY + 58);
      
      doc.fontSize(16)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text(`₹${rideDetails.fare}`, doc.page.width - 140, paymentY + 56, { align: 'right', width: 70 });
      
      currentY += paymentCardHeight + 25;
      
      // Thank You Section (Compact)
      doc.fontSize(12)
         .fillColor(colors.text.primary)
         .font('Helvetica-Bold')
         .text('Thank you for choosing RideApp!', 50, currentY, { align: 'center', width: doc.page.width - 100 });
      
      doc.fontSize(10)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text('We appreciate your business and hope to serve you again soon.', 50, currentY + 15, { 
           align: 'center', 
           width: doc.page.width - 100 
         });
      
      currentY += 45;
      
      // Footer Section (Compact)
      doc.rect(0, currentY, doc.page.width, 60)
         .fillAndStroke(colors.background.medium, colors.background.medium);
      
      // Generation timestamp
      const generatedTime = new Date().toLocaleString('en-IN', { 
        timeZone: 'Asia/Kolkata',
        dateStyle: 'short',
        timeStyle: 'short'
      });
      
      doc.fontSize(8)
         .fillColor(colors.text.secondary)
         .font('Helvetica')
         .text(`Generated: ${generatedTime}`, 50, currentY + 15);
      
      // Support information
      doc.text('Help: support@rideapp.com | +91-XXXX-XXXXXX', 50, currentY + 28);
      
      // Copyright
      doc.fontSize(7)
         .fillColor(colors.text.light)
         .text('© 2025 RideApp. All rights reserved.', 50, currentY + 45, {
           align: 'center',
           width: doc.page.width - 100
         });
      
      // QR Code placeholder (Compact)
      doc.rect(doc.page.width - 70, currentY + 10, 40, 40)
         .fillAndStroke(colors.background.light, colors.text.light)
         .fontSize(7)
         .fillColor(colors.text.secondary)
         .text('QR', doc.page.width - 55, currentY + 28, { align: 'center', width: 10 });
      
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

//     await transporter.sendMail({
//       from: `"RideApp" <${process.env.SMTP_USER}>`,
//       to: riderEmail,
//       subject: "Your Ride Has Been Accepted!",
//       text: `
//         Good news! Your ride has been accepted by a driver.
        
//         Vehicle Details:
//         - Model: ${vehicleDetails.model}
//         - Make: ${vehicleDetails.make}
//         - Plate Number: ${vehicleDetails.plate_no}
//         - Color: ${vehicleDetails.color}
        
//         Ride Details:
//         - Pickup Location: ${pickup.lat}, ${pickup.lng}
//         - Drop Location: ${drop.lat}, ${drop.lng}
//         - Distance: ${rideDetails.distance} km
//         - Fare: ₹${rideDetails.fare}
//         - Ride Date: ${rideDate}
        
//         Your OTP for this ride: ${rideDetails.ride_pin}
//         Please share this OTP with the driver when they arrive to start your ride.
        
//         Thank you for using RideApp!
//       `,
//       html: `
//         <h2>Good news! Your ride has been accepted by a driver.</h2>
        
//         <h3>Vehicle Details:</h3>
//         <ul>
//           <li><strong>Model:</strong> ${vehicleDetails.model}</li>
//           <li><strong>Make:</strong> ${vehicleDetails.make}</li>
//           <li><strong>Plate Number:</strong> ${vehicleDetails.plate_no}</li>
//           <li><strong>Color:</strong> ${vehicleDetails.color}</li>
//         </ul>
        
//         <h3>Ride Details:</h3>
//         <ul>
//           <li><strong>Pickup Location:</strong> ${pickup.lat}, ${pickup.lng}</li>
//           <li><strong>Drop Location:</strong> ${drop.lat}, ${drop.lng}</li>
//           <li><strong>Distance:</strong> ${rideDetails.distance} km</li>
//           <li><strong>Fare:</strong> ₹${rideDetails.fare}</li>
//           <li><strong>Ride Date:</strong> ${rideDate}</li>
//         </ul>
        
//         <h3 style="color: #e74c3c;">Your OTP for this ride: <span style="font-size: 1.2em;">${rideDetails.ride_pin}</span></h3>
//         <p>Please share this OTP with the driver when they arrive to start your ride.</p>
        
//         <p>Thank you for using RideApp!</p>
//       `,
//     });

//     console.log(`Ride acceptance email sent to ${riderEmail}`);
//     return { success: true, message: "Ride acceptance email sent" };
//   } catch (error) {
//     console.error("Ride acceptance email error:", error);
//     return { success: false, message: "Failed to send ride acceptance email" };
//   }
// };

await transporter.sendMail({
  from: `"RideApp" <${process.env.SMTP_USER}>`,
  to: riderEmail,
  subject: "🎉 Your Ride Has Been Accepted! Driver En Route 🚗",
  text: `
    Good news! Your ride has been accepted by a driver.
    
    Your OTP for this ride: ${rideDetails.ride_pin}
    Please share this OTP with the driver when they arrive to start your ride.
    
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
    
    Thank you for using RideApp!
  `,
  html: `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.1);">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 40px; text-align: center; color: white;">
        <div style="background: rgba(255,255,255,0.2); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 36px;">
          🚗
        </div>
        <h1 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">Ride Confirmed!</h1>
        <p style="margin: 0; font-size: 16px; opacity: 0.9;">Your driver is on the way</p>
      </div>

      <!-- OTP Section - Placed at Top -->
      <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 0 0 16px 16px; padding: 30px; text-align: center; margin: 0 20px 30px 20px; box-shadow: 0 6px 20px rgba(245, 87, 108, 0.2);">
        <div style="background: rgba(255,255,255,0.2); width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 28px;">
          🔐
        </div>
        <h3 style="color: white; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">Your OTP for this ride</h3>
        <div style="background: rgba(255,255,255,0.95); color: #2d3748; padding: 20px; border-radius: 12px; display: inline-block; box-shadow: 0 4px 15px rgba(0,0,0,0.2);">
          <span style="font-size: 36px; font-weight: 900; font-family: 'Courier New', monospace; letter-spacing: 8px; color: #e53e3e;">${rideDetails.ride_pin}</span>
        </div>
        <p style="color: white; margin: 20px 0 0 0; font-size: 14px; opacity: 0.9;">
          Please share this OTP with the driver when they arrive to start your ride.
        </p>
      </div>

      <!-- Main Content -->
      <div style="padding: 30px;">

        <!-- Vehicle Details -->
        <div style="background: #f8fafc; border: 2px solid #e2e8f0; border-radius: 12px; padding: 25px; margin-bottom: 25px; position: relative;">
          <div style="position: absolute; top: -12px; left: 25px; background: #4a5568; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
            🚙 Vehicle Details
          </div>
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
              <span style="font-weight: 600; color: #4a5568;">Model:</span>
              <span style="color: #2d3748; font-weight: 500;">${vehicleDetails.model}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
              <span style="font-weight: 600; color: #4a5568;">Make:</span>
              <span style="color: #2d3748; font-weight: 500;">${vehicleDetails.make}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #f56565;">
              <span style="font-weight: 600; color: #4a5568;">Plate Number:</span>
              <span style="color: #e53e3e; font-weight: 700; font-family: monospace; background: #fed7d7; padding: 4px 8px; border-radius: 4px;">${vehicleDetails.plate_no}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #667eea;">
              <span style="font-weight: 600; color: #4a5568;">Color:</span>
              <span style="color: #2d3748; font-weight: 500;">${vehicleDetails.color}</span>
            </div>
          </div>
        </div>

        <!-- Ride Details -->
        <div style="background: #f0fff4; border: 2px solid #9ae6b4; border-radius: 12px; padding: 25px; margin-bottom: 30px; position: relative;">
          <div style="position: absolute; top: -12px; left: 25px; background: #38a169; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase;">
            📍 Ride Details
          </div>
          <div style="margin-top: 10px;">
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #48bb78;">
              <span style="font-weight: 600; color: #4a5568;">🟢 Pickup Location:</span>
              <span style="font-family: monospace;">${pickup.lat}, ${pickup.lng}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #e53e3e;">
              <span style="font-weight: 600; color: #4a5568;">🔴 Drop Location:</span>
              <span style="font-family: monospace;">${drop.lat}, ${drop.lng}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #4299e1;">
              <span style="font-weight: 600; color: #4a5568;">📏 Distance:</span>
              <span style="color: #2b6cb0; font-weight: 700;">${rideDetails.distance} km</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #ed8936;">
              <span style="font-weight: 600; color: #4a5568;">💰 Fare:</span>
              <span style="color: #c05621; font-weight: 700; font-size: 18px;">₹${rideDetails.fare}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 12px; background: white; border-radius: 8px; border-left: 4px solid #9f7aea;">
              <span style="font-weight: 600; color: #4a5568;">🗓️ Ride Date:</span>
              <span style="color: #553c9a; font-weight: 500;">${rideDate}</span>
            </div>
          </div>
        </div>

        <!-- Instructions -->
        <div style="background: #e6fffa; border: 1px solid #81e6d9; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
          <h4 style="color: #234e52; margin: 0 0 15px 0; font-size: 16px;">📋 What's Next?</h4>
          <ul style="margin: 0; padding-left: 20px; color: #2d3748; line-height: 1.6;">
            <li>Your driver will contact you shortly</li>
            <li>Keep your phone handy for driver communication</li>
            <li>Have your OTP ready to share with the driver</li>
            <li>Wait at your pickup location</li>
          </ul>
        </div>

        <!-- Thank You -->
        <div style="text-align: center; padding: 20px;">
          <h2 style="color: #2d3748; margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Thank you for using RideApp! 🙏</h2>
          <p style="color: #718096; margin: 0; font-size: 16px;">We're committed to providing you with a safe and comfortable ride experience.</p>
        </div>

      </div>

      <!-- Footer -->
      <div style="background: #2d3748; color: white; padding: 25px 40px; text-align: center;">
        <p style="margin: 0 0 10px 0; font-size: 14px; opacity: 0.8;">Need help? Contact us:</p>
        <p style="margin: 0 0 15px 0;">
          <a href="mailto:support@rideapp.com" style="color: #90cdf4; text-decoration: none; font-weight: 500;">📧 support@rideapp.com</a> | 
          <a href="tel:+911234567890" style="color: #90cdf4; text-decoration: none; font-weight: 500;">📞 +91-XXXX-XXXXXX</a>
        </p>
        <div style="border-top: 1px solid #4a5568; padding-top: 15px; font-size: 12px; opacity: 0.7;">
          © 2025 RideApp. All rights reserved. | Safe rides, every time.
        </div>
      </div>

    </div>
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
  <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
    <h2 style="color: #2b6cb0; text-align: center; margin-bottom: 20px;">
      Your ride status has changed from <span style="color:#d97706;">accepted</span> to <span style="color:#16a34a;">ongoing</span>.
    </h2>

    <h3 style="margin-bottom: 10px;">Ride Details:</h3>
    <ul style="list-style: none; padding-left: 0; font-size: 16px;">
      <li style="margin: 5px 0;">
        <strong>🚏 Pickup Location:</strong> ${pickup.lat}, ${pickup.lng}
      </li>
      <li style="margin: 5px 0;">
        <strong>🏁 Drop Location:</strong> ${drop.lat}, ${drop.lng}
      </li>
    </ul>

    <p style="margin-top: 20px; text-align: center; font-size: 16px;">
      🚖 Thank you for using <strong>RideApp</strong>!
    </p>
  </div>
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




