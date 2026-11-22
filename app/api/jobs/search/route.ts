import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { searchJobsAcrossPortals } from '@/workers/jobScraper';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const triggerScrape = searchParams.get('scrape') === 'true';

    let jobs = await db.getJobs();

    if (triggerScrape || jobs.length === 0) {
      const profile = await db.getProfile();
      const newJobs = await searchJobsAcrossPortals(profile);
      jobs = await db.saveJobs(newJobs);
    }

    // Filter out blacklisted companies
    const settings = await db.getSettings();
    const blacklistSet = new Set(settings.blacklistedCompanies.map(c => c.toLowerCase()));
    const enriched = jobs.map(j => ({
      ...j,
      isBlacklisted: blacklistSet.has(j.company.toLowerCase()),
    }));

    return NextResponse.json({ jobs: enriched, count: enriched.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const profile = await db.getProfile();
    const newJobs = await searchJobsAcrossPortals(profile, {
      titles: body.titles,
      locations: body.locations,
    });
    const saved = await db.saveJobs(newJobs);
    return NextResponse.json({ jobs: saved, count: saved.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
