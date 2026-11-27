import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveCanonicalLocation } from '@/lib/pipeline/geocoder';
import { validateJobQuality } from '@/lib/pipeline/quality';
import { generateJobFingerprint } from '@/lib/pipeline/deduplicator';
import { NormalizedJob } from '@/app/api/search/jobs/route';

const EMPLOYER_JOBS_FILE = path.join(process.cwd(), 'data', 'employer-jobs.json');

export function getEmployerDirectJobs(): NormalizedJob[] {
  try {
    if (fs.existsSync(EMPLOYER_JOBS_FILE)) {
      const raw = fs.readFileSync(EMPLOYER_JOBS_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read employer-jobs.json', e);
  }
  return [];
}

export async function GET() {
  const jobs = getEmployerDirectJobs();
  return NextResponse.json({ jobs, total: jobs.length });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if batch upload or single job
    const incomingJobs = Array.isArray(body.jobs) ? body.jobs : [body];
    const savedJobs = getEmployerDirectJobs();
    const created: NormalizedJob[] = [];
    const errors: string[] = [];

    for (const item of incomingJobs) {
      const validation = validateJobQuality(item.title, item.company, item.description, item.applyUrl);
      if (!validation.isValid) {
        errors.push(`${item.title || 'Untitled'}: ${validation.reason}`);
        continue;
      }

      const loc = resolveCanonicalLocation(item.location);
      const fp = generateJobFingerprint(item.title, item.company, loc.canonicalId);

      const jobRecord: NormalizedJob = {
        id: `emp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: item.title.trim(),
        company: item.company.trim(),
        location: item.location.trim(),
        country: loc.countryCode,
        state: loc.stateCode,
        city: loc.city,
        latitude: loc.latitude,
        longitude: loc.longitude,
        work_mode: item.workMode || (loc.isRemote ? 'remote' : 'onsite'),
        type: item.type === 'internship' ? 'internship' : 'job',
        salary_or_stipend: item.salary || '',
        posted_at: new Date().toISOString(),
        source: 'Direct Career Page',
        url: item.applyUrl.trim(),
        description: validation.cleanDescription,
        requirements: Array.isArray(item.requirements) ? item.requirements : [],
        experience_level: item.experienceLevel || 'Mid',
      };

      savedJobs.unshift(jobRecord);
      created.push(jobRecord);
    }

    // Persist
    const dir = path.dirname(EMPLOYER_JOBS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EMPLOYER_JOBS_FILE, JSON.stringify(savedJobs, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      errors: errors.length > 0 ? errors : undefined,
      jobs: created,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
