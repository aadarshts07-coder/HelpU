import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  fetchGoalCertificationsFromSupabase,
  upsertGoalCertificationToSupabase,
} from '@/lib/supabase';
import { GoalCertificationRecord } from '@/lib/types';
import { CERTIFICATION_CATALOG_MAP } from '@/lib/data/certifications-catalog';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const analysisId = searchParams.get('analysis_id') || undefined;

    const cookieHeader = req.headers.get('cookie') || '';
    const userIdMatch = cookieHeader.match(/helpu_session=([^;]+)/);
    const userId = userIdMatch && userIdMatch[1] !== 'logged_out' ? userIdMatch[1].trim() : 'usr_demo_101';

    // Fetch from Supabase and local store
    const [supaCerts, localCerts] = await Promise.all([
      fetchGoalCertificationsFromSupabase(userId, analysisId).catch(() => []),
      db.getGoalCertifications(userId, analysisId).catch(() => []),
    ]);

    // Merge by cert_key
    const map = new Map<string, GoalCertificationRecord>();
    localCerts.forEach((c) => map.set(c.cert_key, c));
    supaCerts.forEach((c) => map.set(c.cert_key, c));

    return NextResponse.json({
      certifications: Array.from(map.values()),
    });
  } catch (err: any) {
    console.error('[API GET /api/goal-certifications] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to fetch goal certifications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const userIdMatch = cookieHeader.match(/helpu_session=([^;]+)/);
    const userId = userIdMatch && userIdMatch[1] !== 'logged_out' ? userIdMatch[1].trim() : 'usr_demo_101';

    const body = await req.json();
    const {
      analysis_id,
      cert_key,
      status = 'not_started',
      target_date = null,
      earned_date = null,
      credential_url = null,
    } = body;

    if (!analysis_id || !cert_key) {
      return NextResponse.json({ error: 'analysis_id and cert_key are required.' }, { status: 400 });
    }

    const validStatuses = ['not_started', 'studying', 'booked', 'earned'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const id = `gcert_${userId}_${analysis_id}_${cert_key}`;

    const record: GoalCertificationRecord = {
      id,
      user_id: userId,
      analysis_id,
      cert_key,
      status,
      target_date,
      earned_date: status === 'earned' && !earned_date ? now.split('T')[0] : earned_date,
      credential_url,
      created_at: now,
      updated_at: now,
    };

    // Save to Supabase and Local Store
    await Promise.all([
      upsertGoalCertificationToSupabase(record),
      db.upsertGoalCertification(record),
    ]);

    let addedToResume = false;
    // When marked as earned: Add the certification to the user's profile/resume
    if (status === 'earned') {
      const catalogEntry = CERTIFICATION_CATALOG_MAP.get(cert_key);
      if (catalogEntry) {
        await db.addCertificationToProfile(userId, {
          name: catalogEntry.name,
          issuer: catalogEntry.issuer,
          issueDate: record.earned_date || now.split('T')[0],
          url: credential_url || catalogEntry.official_url,
        });
        addedToResume = true;
      }
    }

    return NextResponse.json({
      success: true,
      record,
      addedToResume,
    });
  } catch (err: any) {
    console.error('[API POST /api/goal-certifications] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update certification' }, { status: 500 });
  }
}
