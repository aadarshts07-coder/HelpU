import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateTailoredCoverLetter } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { title, company, description } = await req.json();
    if (!title || !company) {
      return NextResponse.json({ error: 'Job title and company are required' }, { status: 400 });
    }

    const profile = await db.getProfile();
    const coverLetter = await generateTailoredCoverLetter(profile, {
      title,
      company,
      description: description || `Software role at ${company}`,
    });

    return NextResponse.json({ coverLetter, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
