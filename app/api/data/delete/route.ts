import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { confirmText } = await req.json();

    if (confirmText !== 'DELETE') {
      return NextResponse.json(
        { error: 'Confirmation required. Please type DELETE to purge your account data.' },
        { status: 400 }
      );
    }

    await db.deleteAllUserData();

    return NextResponse.json({
      success: true,
      message: 'All your profile, credentials, applications, and logs have been permanently deleted.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
