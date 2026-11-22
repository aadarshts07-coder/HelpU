import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ApplicationRecord } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, job } = body;

    if (!job || !job.title || !job.company) {
      return NextResponse.json({ error: 'Invalid job data' }, { status: 400 });
    }

    if (action === 'add_to_tracker') {
      const newApp: ApplicationRecord = {
        id: `app_trk_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        jobId: job.id,
        jobTitle: job.title,
        company: job.company,
        location: job.location || 'Remote',
        portal: job.source || 'Direct Career Page',
        applyUrl: job.url || '#',
        matchScore: 85, // Neutral baseline indicator
        status: 'Pending review',
        statusReason: 'Manually added to Tracker from General Job Search.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        screenshots: [],
      };

      await db.saveApplication(newApp);

      // Also create an in-app notification
      await db.addNotification({
        title: 'Job Added to Tracker',
        message: `${job.title} at ${job.company} added to your Application Tracker for review.`,
        type: 'info',
        actionUrl: '/tracker',
      });

      return NextResponse.json({ success: true, application: newApp });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
