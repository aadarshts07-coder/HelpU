import { NextResponse } from 'next/server';
import { createJobAlert, getJobAlerts } from '@/lib/pipeline/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, query, country, state, city, frequency } = body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'A valid email address is required.' }, { status: 400 });
    }

    const alert = createJobAlert({
      email: email.trim().toLowerCase(),
      query: (query || '').trim(),
      country: (country || '').trim().toLowerCase(),
      state: (state || '').trim().toLowerCase(),
      city: (city || '').trim(),
      frequency: frequency === 'daily' ? 'daily' : 'weekly',
    });

    return NextResponse.json({
      success: true,
      message: `Job alert created successfully! We will notify ${email} whenever new matching positions are posted.`,
      alert,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create job alert', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const alerts = getJobAlerts();
  return NextResponse.json({
    total: alerts.length,
    alerts,
  });
}
