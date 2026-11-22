import { NormalizedJob } from '@/app/api/search/jobs/route';

export interface PortalSearchParams {
  query?: string;
  location?: string;
  countries?: string[];
  workMode?: 'all' | 'remote' | 'hybrid' | 'onsite' | string;
  experienceLevel?: 'all' | 'intern' | 'entry' | 'mid' | 'senior' | string;
  datePosted?: 'all' | '24h' | '7d' | '30d' | string;
  type?: 'all' | 'job' | 'internship';
  page?: number;
  limit?: number;
}

export interface PortalAdapter {
  id: string;
  name: string;
  baseUrl: string;
  fetchJobs(params: PortalSearchParams): Promise<NormalizedJob[]>;
}

export interface PortalConfig {
  id: string;
  name: string;
  baseUrl: string;
  adapter: PortalAdapter;
  requiresManualLogin?: boolean;
}
