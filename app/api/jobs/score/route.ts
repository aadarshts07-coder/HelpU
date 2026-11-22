import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { scoreJobMatch } from '@/lib/ai';

export async function POST(req: Request) {
  try {
    const { title, company, description, location } = await req.json();
    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description required' }, { status: 400 });
    }

    const profile = await db.getProfile();
    const result = await scoreJobMatch(profile, { title, company, description, location });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
