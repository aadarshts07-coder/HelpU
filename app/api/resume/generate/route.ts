import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateATSResume } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const profile = await db.getProfile();
    const targetRole = body.targetRole || profile.targetJobTitles[0];

    const resume = await generateATSResume(profile, targetRole);
    return NextResponse.json({ resume, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
