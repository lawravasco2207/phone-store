// Minimal mailer: uses SMTP env; falls back to Ethereal in dev.
import nodemailer from 'nodemailer';

let transporterPromise;

async function getTransporter() {
  if (transporterPromise) return transporterPromise;
  
  console.log('Creating new transporter...');
  console.log('SMTP_HOST:', process.env.SMTP_HOST ? 'SET' : 'NOT SET');
  
  if (process.env.SMTP_HOST) {
    console.log('Using SMTP configuration');
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    }));
  } else {
    console.log('Using development mode - creating dummy transporter');
    // Create a dummy transporter that just logs emails instead of sending them
    transporterPromise = Promise.resolve(nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true
    }));
  }
  return transporterPromise;
}

export async function sendMail({ to, subject, html }) {
  try {
    console.log('Attempting to send email to:', to);
    console.log('Subject:', subject);
    const transporter = await getTransporter();
    console.log('Transporter created successfully');
    const info = await transporter.sendMail({ from: process.env.EMAIL_FROM || 'noreply@example.com', to, subject, html });
    console.log('Email sent successfully:', info.messageId);
    
    // In development with stream transport, log the email content
    if (info.message) {
      console.log('Email content:');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('HTML:', html);
      console.log('---');
    }
    
    if (nodemailer.getTestMessageUrl) {
      const url = nodemailer.getTestMessageUrl(info);
      if (url) console.log('Preview email:', url);
    }
    return info;
  } catch (error) {
    console.error('Failed to send email:', error.message);
    throw error;
  }
}

export async function sendVerificationEmail(to, token) {
  const url = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verified?token=${encodeURIComponent(token)}`;
  const apiUrl = `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${encodeURIComponent(token)}`;
  // Provide both direct API and frontend landing link; frontend may redirect too.
  return sendMail({
    to,
    subject: 'Verify your email',
    html: `<p>Confirm your email to finish setup.</p><p><a href="${apiUrl}">Verify now</a></p><p>If link fails, open: ${apiUrl}</p>`,
  });
}