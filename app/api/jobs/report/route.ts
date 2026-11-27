import { NextResponse } from 'next/server';
import { recordJobReport, getJobReports } from '@/lib/pipeline/store';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { jobId, jobTitle, company, reason, details } = body;

    if (!jobId || !reason) {
      return NextResponse.json(
        { error: 'Job ID and report reason are required.' },
        { status: 400 }
      );
    }

    const report = recordJobReport({
      jobId: String(jobId),
      jobTitle: String(jobTitle || 'Unknown Job'),
      company: String(company || 'Unknown Company'),
      reason: String(reason),
      details: String(details || ''),
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you for reporting. Our moderation and quality team will review this posting.',
      report,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to submit job report', message: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  const reports = getJobReports();
  return NextResponse.json({
    total: reports.length,
    reports,
  });
}
