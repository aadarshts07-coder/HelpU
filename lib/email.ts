import nodemailer from 'nodemailer';
import { ApplicationRecord } from './types';

interface EmailNotificationParams {
  to: string;
  application: ApplicationRecord;
  reason?: string;
}

export async function sendApplicationStatusEmail({
  to,
  application,
  reason,
}: EmailNotificationParams): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // Determine badge color and label based on status
  let statusBadge = '#10B981'; // Green for applied
  let statusLabel = 'Successfully Applied';
  let bannerMessage = `Your application for ${application.jobTitle} at ${application.company} was submitted via ${application.portal}.`;

  if (application.status === 'Needs manual action') {
    statusBadge = '#F59E0B'; // Amber
    statusLabel = 'Action Required';
    bannerMessage = `Your attention is needed for ${application.jobTitle} at ${application.company} (${reason || 'CAPTCHA / Login wall detected'}). Automation paused safely.`;
  } else if (application.status === 'Failed') {
    statusBadge = '#EF4444'; // Red
    statusLabel = 'Application Failed';
    bannerMessage = `We encountered an issue submitting your application for ${application.jobTitle} at ${application.company}.`;
  } else if (application.status === 'Pending review') {
    statusBadge = '#6366F1'; // Indigo
    statusLabel = 'Pending Your Approval';
    bannerMessage = `Application form filled for ${application.jobTitle} at ${application.company}. Ready for your 1-click review and submission.`;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
        .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .header { background: #4f46e5; padding: 24px; color: white; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 700; }
        .content { padding: 24px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; color: white; font-size: 13px; font-weight: 600; background-color: ${statusBadge}; margin-bottom: 16px; }
        .detail-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 10px 0; font-size: 14px; }
        .label { color: #64748b; font-weight: 500; }
        .value { color: #0f172a; font-weight: 600; }
        .btn { display: inline-block; margin-top: 24px; background-color: #4f46e5; color: white !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; }
        .footer { background: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          <h1>HELP U — Application Update</h1>
        </div>
        <div class="content">
          <div class="badge">${statusLabel}</div>
          <p style="font-size: 15px; line-height: 1.5; margin-bottom: 20px;">${bannerMessage}</p>
          
          <div class="detail-row">
            <span class="label">Job Title</span>
            <span class="value">${application.jobTitle}</span>
          </div>
          <div class="detail-row">
            <span class="label">Company</span>
            <span class="value">${application.company}</span>
          </div>
          <div class="detail-row">
            <span class="label">Platform</span>
            <span class="value">${application.portal}</span>
          </div>
          <div class="detail-row">
            <span class="label">Match Score</span>
            <span class="value">${application.matchScore}% Match</span>
          </div>
          <div class="detail-row">
            <span class="label">Timestamp</span>
            <span class="value">${new Date().toLocaleString()}</span>
          </div>

          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/tracker" class="btn">View in Application Tracker</a>
        </div>
        <div class="footer">
          Automated notification from HELP U AI Job Application Assistant.<br/>
          To adjust email preferences or pause automation, visit Settings.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!user || !pass || user.trim() === '') {
    // Graceful simulated delivery (logged cleanly)
    console.log(`[Email Simulation] Sent notification to ${to} for ${application.jobTitle} at ${application.company} (Status: ${application.status})`);
    return { success: true, simulated: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"HELP U Assistant" <notifications@helpu.app>',
      to,
      subject: `[${statusLabel}] ${application.jobTitle} at ${application.company}`,
      html: htmlContent,
    });

    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error('Failed to send status email:', err);
    return { success: false };
  }
}
