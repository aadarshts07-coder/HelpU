import { extractCountryCodeFromLocation } from '@/lib/countries';

export function detectJobType(title: string, description: string = ''): 'internship' | 'job' {
  const text = `${title} ${description}`.toLowerCase();
  if (/\b(intern|internship|trainee|apprentice|apprenticeship|co-op|coop|student|fellowship)\b/i.test(text)) {
    return 'internship';
  }
  return 'job';
}

export function detectExperienceLevel(title: string): 'Intern' | 'Entry' | 'Mid' | 'Senior' {
  const t = title.toLowerCase();
  if (/\b(intern|internship|trainee|apprentice|co-op)\b/i.test(t)) return 'Intern';
  if (/\b(senior|sr\b|lead|principal|architect|director|head|staff|manager)\b/i.test(t)) return 'Senior';
  if (/\b(junior|jr\b|associate|entry|graduate|grad)\b/i.test(t)) return 'Entry';
  return 'Mid';
}

export function detectWorkMode(locationText: string = '', titleText: string = ''): 'remote' | 'hybrid' | 'onsite' {
  const combined = `${locationText} ${titleText}`.toLowerCase();
  if (combined.includes('remote') || combined.includes('work from home')) return 'remote';
  if (combined.includes('hybrid')) return 'hybrid';
  return 'onsite';
}

export function matchesClientFilters(
  job: {
    title: string;
    description: string;
    location: string;
    work_mode: string;
    type: string;
    experience_level: string;
    posted_at: string;
  },
  filters: {
    query?: string;
    location?: string;
    workMode?: string;
    experienceLevel?: string;
    type?: string;
    datePosted?: string;
    countries?: string[];
  }
): boolean {
  if (filters.query) {
    const tokens = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
    const content = `${job.title} ${job.description} ${job.location}`.toLowerCase();
    if (!tokens.every((t) => content.includes(t))) return false;
  }

  if (filters.type && filters.type !== 'all') {
    if (filters.type === 'internship' && job.type !== 'internship') return false;
    if (filters.type === 'job' && job.type !== 'job') return false;
  }

  if (filters.workMode && filters.workMode !== 'all') {
    if (job.work_mode !== filters.workMode) return false;
  }

  if (filters.experienceLevel && filters.experienceLevel !== 'all') {
    if (job.experience_level.toLowerCase() !== filters.experienceLevel.toLowerCase()) return false;
  }

  if (filters.location) {
    const locFilter = filters.location.toLowerCase();
    if (locFilter === 'remote' && job.work_mode !== 'remote' && !job.location.toLowerCase().includes('remote')) {
      return false;
    }
    if (locFilter !== 'remote' && !job.location.toLowerCase().includes(locFilter)) {
      return false;
    }
  }

  if (filters.datePosted && filters.datePosted !== 'all') {
    const now = Date.now();
    const cutoffMap: Record<string, number> = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    const cutoff = cutoffMap[filters.datePosted];
    if (cutoff) {
      const jobTime = new Date(job.posted_at).getTime();
      if (now - jobTime > cutoff) return false;
    }
  }

  if (filters.countries && filters.countries.length > 0) {
    const jobCountry = extractCountryCodeFromLocation(job.location);
    const countrySet = new Set(filters.countries.map((c) => c.toLowerCase()));
    const wantsRemoteWorldwide = countrySet.has('remote') || countrySet.has('worldwide');

    const matchesCountry =
      (wantsRemoteWorldwide && (job.work_mode === 'remote' || job.location.toLowerCase().includes('remote'))) ||
      (jobCountry && countrySet.has(jobCountry)) ||
      Array.from(countrySet).some((code) => code !== 'remote' && job.location.toLowerCase().includes(code));

    if (!matchesCountry) return false;
  }

  return true;
}
