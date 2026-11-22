import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { triggerProfilePipeline } from '@/lib/pipeline';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const status = await db.getPipelineStatus();
    const resumeVersions = await db.getResumeVersions();
    return NextResponse.json({
      status,
      resumeVersions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const profile = await db.getProfile();
    // Immediate pipeline execution triggered manually
    triggerProfilePipeline(profile, true);
    return NextResponse.json({ success: true, message: 'Pipeline triggered immediately' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
