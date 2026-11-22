import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { triggerProfilePipeline } from '@/lib/pipeline';
import { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const profile = await db.getProfile();
    return NextResponse.json(
      { profile },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body: Partial<UserProfile> = await req.json();

    // Validation
    if (body.name !== undefined && body.name.trim() === '') {
      return NextResponse.json({ error: 'Full name is required.' }, { status: 400 });
    }

    if (body.email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Please provide a valid email address.' }, { status: 400 });
      }
    }

    if (body.targetJobTitles !== undefined && body.targetJobTitles.length === 0) {
      return NextResponse.json(
        { error: 'Please specify at least one target job title.' },
        { status: 400 }
      );
    }

    // Persist to database
    const updated = await db.updateProfile(body);

    // Asynchronously trigger the debounced background pipeline
    // This returns immediately so the HTTP response is instantaneous (<100ms)
    // The pipeline debounces rapid saves within 3s into a single run
    triggerProfilePipeline(updated).catch((err) => {
      console.error('[API PUT /profile] Background pipeline trigger error:', err);
    });

    return NextResponse.json(
      { profile: updated, success: true, message: 'Profile saved successfully' },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (err: any) {
    console.error('[API PUT /profile] Save error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
