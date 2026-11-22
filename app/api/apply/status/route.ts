import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');
    const portalFilter = searchParams.get('portal');
    const query = searchParams.get('q')?.toLowerCase();

    let applications = await db.getApplications();

    if (statusFilter && statusFilter !== 'ALL') {
      applications = applications.filter(a => a.status === statusFilter);
    }

    if (portalFilter && portalFilter !== 'ALL') {
      applications = applications.filter(a => a.portal.toLowerCase() === portalFilter.toLowerCase());
    }

    if (query) {
      applications = applications.filter(a => 
        a.jobTitle.toLowerCase().includes(query) ||
        a.company.toLowerCase().includes(query) ||
        a.location.toLowerCase().includes(query)
      );
    }

    const metrics = await db.getMetrics();

    return NextResponse.json({
      applications,
      metrics,
      total: applications.length,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
