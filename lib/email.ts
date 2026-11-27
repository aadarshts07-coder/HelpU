import nodemailer from 'nodemailer';
import { ApplicationRecord } from './types';
import { BRAND } from './config/brand';

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const port = Number(process.env.SMTP_PORT) || 587;

  if (!user || !pass || user.trim() === '') {
    return null; // Development simulation
  }

  return nodemailer.createTransport({
    host: host || 'smtp.gmail.com',
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

function getSender() {
  return process.env.SMTP_FROM || `"${BRAND.displayName} Security" <no-reply@${BRAND.name}>`;
}

/**
 * 1. Verification Email Template
 */
export async function sendVerificationEmail({
  to,
  name,
  verificationUrl,
  otpCode,
}: {
  to: string;
  name: string;
  verificationUrl: string;
  otpCode?: string;
}): Promise<{ success: boolean; simulated?: boolean; messageId?: string }> {
  const transporter = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #4f46e5; padding: 28px; color: white; text-align: center; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; margin: 20px 0; }
        .otp-box { background: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 16px; text-align: center; margin: 20px 0; }
        .otp-code { font-family: monospace; font-size: 28px; font-weight: 800; letter-spacing: 6px; color: #4f46e5; }
        .note { font-size: 12px; color: #64748b; margin-top: 20px; }
        .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>${BRAND.displayName}</h1>
          <p style="margin: 4px 0 0; opacity: 0.85; font-size: 13px;">Verify Your Email Address</p>
        </div>
        <div class="content">
          <p>Hi <strong>${name || 'there'}</strong>,</p>
          <p>Welcome to <strong>${BRAND.displayName}</strong>. To protect your account and activate automated job applications, please verify that this email address belongs to you.</p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" class="btn">Verify Email Address</a>
          </div>

          ${otpCode ? `
            <div class="otp-box">
              <div style="font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 6px; text-transform: uppercase;">Or enter this 6-digit confirmation code:</div>
              <div class="otp-code">${otpCode}</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 6px;">Expires in 10 minutes • Single use</div>
            </div>
          ` : ''}

          <p class="note">
            This verification link expires in 24 hours. If you did not create an account on ${BRAND.displayName}, please ignore this email.
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} ${BRAND.displayName} Inc. All rights reserved.<br/>
          Secure autonomous career assistance.
        </div>
      </div>
    </body>
    </html>
  `;

  const plainText = `Hi ${name || 'there'},\n\nWelcome to ${BRAND.displayName}!\n\nPlease verify your email address by visiting this link:\n${verificationUrl}\n\n${otpCode ? `Or enter this 6-digit code: ${otpCode}\n\n` : ''}This link expires in 24 hours.\n\nBest regards,\n${BRAND.displayName} Team`;

  if (!transporter) {
    console.log(`\n================================================================`);
    console.log(`[EMAIL SIMULATION] Verification Email sent to: ${to}`);
    console.log(`🔗 Verification Link: ${verificationUrl}`);
    if (otpCode) console.log(`🔢 6-Digit OTP Code:  ${otpCode}`);
    console.log(`================================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: getSender(),
      to,
      subject: `Verify your email for ${BRAND.displayName}`,
      text: plainText,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send verification email:', err);
    return { success: false };
  }
}

/**
 * 2. Welcome Email Template
 */
export async function sendWelcomeEmail({
  to,
  name,
}: {
  to: string;
  name: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: #4f46e5; padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Welcome to ${BRAND.displayName}!</h1>
        </div>
        <div style="padding: 28px; line-height: 1.6; color: #1e293b;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>Your email has been successfully verified! Your workspace is active and protected with AES-256 session encryption.</p>
          <p>Here is what you can do right away:</p>
          <ul>
            <li><strong>Complete Profile Builder:</strong> Add your education, experience, and top tech skills.</li>
            <li><strong>Set Application Safety:</strong> Configure Review Mode to approve every application before submission.</li>
            <li><strong>Simulate Interviews:</strong> Try our AI Interview Copilot with real-time STAR scoring.</li>
          </ul>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${appUrl}/dashboard" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">Go to Dashboard</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Welcome Email sent to: ${to}`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getSender(),
      to,
      subject: `Welcome to ${BRAND.displayName} — Your Account is Verified!`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    return { success: false };
  }
}

/**
 * 3. Password Reset Request Email
 */
export async function sendPasswordResetEmail({
  to,
  name,
  resetUrl,
}: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: #4f46e5; padding: 24px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">Password Reset Request</h1>
        </div>
        <div style="padding: 28px; line-height: 1.6; color: #1e293b;">
          <p>Hi <strong>${name || 'there'}</strong>,</p>
          <p>We received a request to reset the password for your ${BRAND.displayName} account.</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 700;">Reset Your Password</a>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            This link expires in <strong>30 minutes</strong> and can only be used once. If you did not request a password reset, you can safely ignore this message.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n================================================================`);
    console.log(`[EMAIL SIMULATION] Password Reset Email sent to: ${to}`);
    console.log(`🔗 Reset Link: ${resetUrl}`);
    console.log(`================================================================\n`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getSender(),
      to,
      subject: `Reset your ${BRAND.displayName} password`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send reset email:', err);
    return { success: false };
  }
}

/**
 * 4. Password Changed Security Alert
 */
export async function sendPasswordChangedAlert({
  to,
  name,
  ipAddress,
}: {
  to: string;
  name: string;
  ipAddress: string;
}): Promise<{ success: boolean; simulated?: boolean }> {
  const transporter = getTransporter();

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; padding: 24px;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden;">
        <div style="background: #ef4444; padding: 20px; color: white; text-align: center;">
          <h1 style="margin: 0; font-size: 18px;">Security Alert: Password Changed</h1>
        </div>
        <div style="padding: 24px; line-height: 1.6; color: #1e293b; font-size: 13px;">
          <p>Hi <strong>${name}</strong>,</p>
          <p>The password for your ${BRAND.displayName} account was changed on <strong>${new Date().toUTCString()}</strong> from IP address <code>${ipAddress}</code>.</p>
          <p>All other active sessions have been invalidated for your protection.</p>
          <p>If you did not make this change, please contact security immediately or reset your password.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Password Changed Alert sent to: ${to} (IP: ${ipAddress})`);
    return { success: true, simulated: true };
  }

  try {
    await transporter.sendMail({
      from: getSender(),
      to,
      subject: `Security Alert: Your ${BRAND.displayName} password was changed`,
      html,
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to send password alert email:', err);
    return { success: false };
  }
}

/**
 * 5. Application Status Email (Preserved)
 */
export async function sendApplicationStatusEmail({
  to,
  application,
  reason,
}: {
  to: string;
  application: ApplicationRecord;
  reason?: string;
}): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const transporter = getTransporter();

  let statusBadge = '#10B981';
  let statusLabel = 'Successfully Applied';
  let bannerMessage = `Your application for ${application.jobTitle} at ${application.company} was submitted via ${application.portal}.`;

  if (application.status === 'Needs manual action') {
    statusBadge = '#F59E0B';
    statusLabel = 'Action Required';
    bannerMessage = `Attention needed for ${application.jobTitle} at ${application.company} (${reason || 'CAPTCHA / Login wall'}). Automation paused safely.`;
  } else if (application.status === 'Failed') {
    statusBadge = '#EF4444';
    statusLabel = 'Application Failed';
    bannerMessage = `Issue submitting application for ${application.jobTitle} at ${application.company}.`;
  } else if (application.status === 'Pending review') {
    statusBadge = '#6366F1';
    statusLabel = 'Pending Your Approval';
    bannerMessage = `Application form filled for ${application.jobTitle} at ${application.company}. Ready for your review.`;
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px; color: #1e293b;">
      <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; padding: 24px;">
        <h2 style="margin-top: 0; color: #4f46e5;">${BRAND.displayName} — Application Update</h2>
        <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; color: white; background-color: ${statusBadge}; font-size: 12px; font-weight: bold;">${statusLabel}</span>
        <p style="margin: 16px 0;">${bannerMessage}</p>
        <p style="font-size: 13px; color: #64748b;"><strong>Job:</strong> ${application.jobTitle} @ ${application.company} (${application.portal})</p>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`[EMAIL SIMULATION] Application status email sent to: ${to} (Status: ${application.status})`);
    return { success: true, simulated: true };
  }

  try {
    const info = await transporter.sendMail({
      from: getSender(),
      to,
      subject: `[${statusLabel}] ${application.jobTitle} at ${application.company}`,
      html,
    });
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send status email:', err);
    return { success: false };
  }
}
