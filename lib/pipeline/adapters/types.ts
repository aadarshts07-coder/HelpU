import { NormalizedJob } from '@/app/api/search/jobs/route';

export interface SourceSearchParams {
  query?: string;
  country?: string; // 2-letter lowercase ISO
  state?: string;   // lowercase code e.g. "tn"
  city?: string;    // e.g. "madurai"
  workMode?: 'all' | 'remote' | 'hybrid' | 'onsite';
  limit?: number;
  page?: number;
}

export interface SourceAdapter {
  id: string;
  name: string;
  type: 'ats' | 'aggregator' | 'remote_feed' | 'government' | 'employer_direct';
  termsCompliant: true;
  fetchJobs(params: SourceSearchParams): Promise<NormalizedJob[]>;
  healthCheck?(): Promise<{ ok: boolean; latencyMs: number }>;
}
