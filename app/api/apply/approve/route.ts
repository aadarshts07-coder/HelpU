import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendApplicationStatusEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const { applicationId, action = 'approve', notes } = await req.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const app = await db.getApplicationById(applicationId);
    if (!app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (action === 'skip') {
      const updated = await db.updateApplicationStatus(
        applicationId,
        'Rejected',
        notes || 'Application skipped by candidate during review.'
      );
      return NextResponse.json({ success: true, application: updated, action: 'skipped' });
    }

    // Move status to Applied
    const updated = await db.updateApplicationStatus(
      applicationId,
      'Applied',
      notes || 'Application reviewed and approved for submission by user.'
    );

    if (updated) {
      await db.addNotification({
        title: `Application Approved: ${updated.company}`,
        message: `${updated.jobTitle} application submitted after your approval.`,
        type: 'success',
        actionUrl: '/tracker',
        jobId: updated.jobId,
      });

      const profile = await db.getProfile();
      const settings = await db.getSettings();
      if (settings.emailNotifications) {
        await sendApplicationStatusEmail({
          to: settings.notificationEmail || profile.email,
          application: updated,
          reason: 'User approved submission',
        });
      }
    }

    return NextResponse.json({ success: true, application: updated, action: 'approved' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
