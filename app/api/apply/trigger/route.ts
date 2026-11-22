import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { queueJobApplication } from '@/lib/queue';

export async function POST(req: Request) {
  try {
    const { jobId, jobIds } = await req.json();

    const settings = await db.getSettings();
    if (settings.isPaused) {
      return NextResponse.json(
        { error: 'Automation is currently paused. Resume it in Settings before applying.' },
        { status: 400 }
      );
    }

    if (!settings.consentGiven) {
      return NextResponse.json(
        { error: 'Security consent required before starting automation.' },
        { status: 403 }
      );
    }

    const allJobs = await db.getJobs();
    const targetedIds = jobIds || (jobId ? [jobId] : []);

    if (targetedIds.length === 0) {
      return NextResponse.json({ error: 'No job IDs provided' }, { status: 400 });
    }

    const createdRecords = [];
    const errors = [];

    for (const id of targetedIds) {
      const match = allJobs.find(j => j.id === id);
      if (!match) {
        errors.push(`Job ${id} not found`);
        continue;
      }

      try {
        const record = await queueJobApplication(match);
        createdRecords.push(record);
      } catch (applyErr: any) {
        errors.push(applyErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      applications: createdRecords,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
