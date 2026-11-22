import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const profile = await db.getProfile();
    const versions = await db.getResumeVersions();
    const latest = versions[versions.length - 1];
    console.log(`[DIAGNOSE /resume/versions] Profile updatedAt: ${profile.updatedAt} | Displayed Resume: ${latest?.label} (createdAt: ${latest?.createdAt}) | Snapshot Company: ${latest?.resumeData?.experience?.[0]?.company}`);
    return NextResponse.json({ versions, profileUpdatedAt: profile.updatedAt });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
