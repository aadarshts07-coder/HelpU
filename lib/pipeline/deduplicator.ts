import crypto from 'crypto';
import { NormalizedJob } from '@/app/api/search/jobs/route';

export interface DeduplicatedJob extends NormalizedJob {
  fingerprint: string;
  sourceList?: { source: string; applyUrl: string }[];
  qualityScore?: number;
}

/**
 * Creates a deterministic SHA-256 fingerprint from title, company, and location
 */
export function generateJobFingerprint(title: string, company: string, canonicalLocationId: string): string {
  const normTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normCompany = company.toLowerCase().replace(/[^a-z0-9]/g, '');
  const normLoc = canonicalLocationId.toLowerCase().replace(/[^a-z0-9-]/g, '');

  const payload = `${normTitle}_${normCompany}_${normLoc}`;
  return crypto.createHash('sha256').update(payload).digest('hex').substring(0, 24);
}

/**
 * Deduplicates an array of NormalizedJobs by fingerprint.
 * Merges duplicate entries while preserving all official application links.
 */
export function deduplicateJobs(jobs: NormalizedJob[]): DeduplicatedJob[] {
  const map = new Map<string, DeduplicatedJob>();

  for (const job of jobs) {
    const canonicalLocId = (job as any).canonical_location_id || job.location;
    const fp = (job as any).fingerprint || generateJobFingerprint(job.title, job.company, canonicalLocId);

    const existing = map.get(fp);
    if (!existing) {
      map.set(fp, {
        ...job,
        fingerprint: fp,
        sourceList: [{ source: job.source, applyUrl: job.url }],
      });
    } else {
      // Merge source links
      const alreadyHasSource = existing.sourceList?.some((s) => s.source === job.source);
      if (!alreadyHasSource && existing.sourceList) {
        existing.sourceList.push({ source: job.source, applyUrl: job.url });
      }

      // Keep longer / richer description if incoming has more content
      if (job.description && job.description.length > (existing.description || '').length) {
        existing.description = job.description;
      }

      // Merge requirements
      if (job.requirements && job.requirements.length > (existing.requirements || []).length) {
        existing.requirements = job.requirements;
      }
    }
  }

  return Array.from(map.values());
}
