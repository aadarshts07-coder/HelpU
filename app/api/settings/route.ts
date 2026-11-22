import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { encryptCredential } from '@/lib/crypto';

export async function GET() {
  try {
    const settings = await db.getSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();

    // If portal passwords are provided, encrypt them with AES-256
    if (body.portalCredentials) {
      const creds = { ...body.portalCredentials };
      if (creds.linkedin?.password) {
        creds.linkedin.encryptedPassword = encryptCredential(creds.linkedin.password);
        delete creds.linkedin.password;
      }
      if (creds.indeed?.password) {
        creds.indeed.encryptedPassword = encryptCredential(creds.indeed.password);
        delete creds.indeed.password;
      }
      if (creds.naukri?.password) {
        creds.naukri.encryptedPassword = encryptCredential(creds.naukri.password);
        delete creds.naukri.password;
      }
      body.portalCredentials = creds;
    }

    const updated = await db.updateSettings(body);
    return NextResponse.json({ settings: updated, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
