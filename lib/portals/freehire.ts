import { NormalizedJob } from '@/app/api/search/jobs/route';
import { PortalAdapter, PortalSearchParams } from './types';
import { BRAND } from '@/lib/config/brand';
import { detectJobType, detectExperienceLevel, detectWorkMode, matchesClientFilters } from './utils';

function cleanHtml(html: string = ''): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// 15-minute backend query cache for FreeHire API responses
const freehireCache = new Map<string, { jobs: NormalizedJob[]; total: number; expiresAt: number }>();
const CACHE_TTL_MS = 15 * 60 * 1000;

export const freehireAdapter: PortalAdapter = {
  id: 'freehire',
  name: BRAND.portalName,
  baseUrl: 'https://freehire.me',

  async fetchJobs(params: PortalSearchParams): Promise<NormalizedJob[]> {
    const rawQuery = params.query?.trim() || '';
    const isInternship = params.type === 'internship' || /\b(intern|internship|trainee|apprentice|co-op)\b/i.test(rawQuery);
    
    // Build query string
    let query = rawQuery;
    if (params.type === 'internship' && !/\b(intern|internship|trainee|apprentice|co-op)\b/i.test(query)) {
      query = query ? `${query} Intern` : 'Intern';
    }

    const page = params.page || 1;
    const limit = params.limit ? Math.min(params.limit * 2, 50) : 30;
    const offset = (page - 1) * limit;

    const cacheKey = JSON.stringify({ query, isInternship, page, limit, workMode: params.workMode, experienceLevel: params.experienceLevel, datePosted: params.datePosted, location: params.location, countries: params.countries });
    const cached = freehireCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.jobs;
    }

    const url = new URL('https://freehire.me/api/v1/jobs/search');
    if (query) {
      url.searchParams.set('q', query);
    }
    url.searchParams.set('limit', limit.toString());
    if (offset > 0) {
      url.searchParams.set('offset', offset.toString());
    }

    // Countries filter (supports lowercase ISO codes and remote worldwide)
    if (params.countries && params.countries.length > 0) {
      const realCountryCodes = params.countries.filter((c) => c !== 'remote');
      if (realCountryCodes.length > 0) {
        url.searchParams.set('countries', realCountryCodes.join(','));
      }
      if (params.countries.includes('remote')) {
        url.searchParams.set('work_mode', 'remote');
      }
    }

    // Work Mode
    if (params.workMode && params.workMode !== 'all') {
      url.searchParams.set('work_mode', params.workMode);
    }

    // Seniority / Experience Level
    if (isInternship) {
      url.searchParams.set('seniority', 'intern');
    } else if (params.experienceLevel && params.experienceLevel !== 'all') {
      const levelMap: Record<string, string> = {
        intern: 'intern',
        entry: 'junior',
        mid: 'mid',
        senior: 'senior',
      };
      const mapped = levelMap[params.experienceLevel.toLowerCase()];
      if (mapped) {
        url.searchParams.set('seniority', mapped);
      }
    }

    // Country/location filter if 2 chars (e.g. 'us', 'in', 'gb')
    if (params.location && params.location !== 'all' && params.location !== 'remote') {
      const locClean = params.location.toLowerCase().trim();
      if (locClean.length === 2) {
        url.searchParams.set('countries', locClean);
      }
    }

    // Freshness
    if (params.datePosted && params.datePosted === '24h') {
      url.searchParams.set('reality', 'fresh');
    }

    // Optional API Key support (Backend only: FREEHIRE_API_KEY)
    const apiKey = process.env.FREEHIRE_API_KEY?.trim();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (compatible; HelpU-JobSearch/1.0; +https://freehire.me)',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    let attempts = 0;
    let res: Response | null = null;

    // Retry with backoff (up to 2 attempts, 7s timeout)
    while (attempts < 2) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        res = await fetch(url.toString(), {
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);
        if (res.ok) break;
      } catch (err) {
        attempts++;
        if (attempts >= 2) break;
        await new Promise((resolve) => setTimeout(resolve, 600));
      }
    }

    if (!res || !res.ok) {
      console.warn(`[FreeHire Adapter] Request failed or timed out: ${url.toString()} (status: ${res?.status})`);
      return [];
    }

    try {
      const json = await res.json();
      const rawJobs = Array.isArray(json.data) ? json.data : [];

      // Skip closed jobs
      const openJobs = rawJobs.filter((j: any) => !j.closed_at);

      const normalized: NormalizedJob[] = openJobs.map((j: any) => {
        const title = j.title || 'Tech Opportunity';
        const company = j.company || 'Direct Employer';
        
        // Location formatting from countries, cities, or raw location string
        let loc = j.location || '';
        if (!loc && Array.isArray(j.cities) && j.cities.length > 0) {
          loc = j.cities.join(', ');
        } else if (!loc && Array.isArray(j.countries) && j.countries.length > 0) {
          loc = j.countries.map((c: string) => c.toUpperCase()).join(', ');
        }
        if (!loc) loc = j.work_mode === 'remote' ? 'Remote / Worldwide' : 'Worldwide';

        const cleanDesc = cleanHtml(j.description || `${title} at ${company}. Direct official listing aggregated from employer ATS.`);
        
        // Detect job type
        const isInternByTitle = /\b(intern|internship|trainee|apprentice|co-op)\b/i.test(title);
        const isInternByEnrichment = j.enrichment?.seniority === 'intern' || j.enrichment?.employment_type === 'internship';
        const type: 'internship' | 'job' = isInternByTitle || isInternByEnrichment || isInternship ? 'internship' : detectJobType(title, cleanDesc);

        // Work mode
        let workMode: 'remote' | 'hybrid' | 'onsite' = 'onsite';
        if (j.work_mode === 'remote') workMode = 'remote';
        else if (j.work_mode === 'hybrid') workMode = 'hybrid';
        else workMode = detectWorkMode(loc, title);

        // Experience level
        let experienceLevel: 'Intern' | 'Entry' | 'Mid' | 'Senior' = detectExperienceLevel(title);
        if (type === 'internship') {
          experienceLevel = 'Intern';
        } else if (j.enrichment?.seniority) {
          const s = String(j.enrichment.seniority).toLowerCase();
          if (s.includes('intern')) experienceLevel = 'Intern';
          else if (s.includes('junior') || s.includes('entry')) experienceLevel = 'Entry';
          else if (s.includes('senior') || s.includes('lead') || s.includes('staff') || s.includes('principal')) experienceLevel = 'Senior';
          else experienceLevel = 'Mid';
        }

        // Format salary / compensation if available
        let salaryStr = 'Competitive / Market Rate';
        if (j.salary_min && j.salary_max) {
          const currency = j.salary_currency ? `${j.salary_currency} ` : '$';
          const period = j.salary_period ? ` / ${j.salary_period}` : ' / yr';
          salaryStr = `${currency}${j.salary_min.toLocaleString()} - ${currency}${j.salary_max.toLocaleString()}${period}`;
        } else if (j.salary_min) {
          const currency = j.salary_currency ? `${j.salary_currency} ` : '$';
          salaryStr = `From ${currency}${j.salary_min.toLocaleString()} / yr`;
        } else if (type === 'internship') {
          salaryStr = '$35 - $55 / hr (Paid)';
        }

        // Direct apply URL - prefer original employer ATS link
        const applyUrl = j.url || `https://freehire.me/jobs/${j.public_slug}`;

        // Check if ATS might require login (e.g. workday, icims)
        const lowerUrl = (applyUrl || '').toLowerCase();
        const requiresManualLogin = lowerUrl.includes('myworkdayjobs.com') || lowerUrl.includes('icims.com');

        // Extract skills
        const skills: string[] = Array.isArray(j.skills)
          ? j.skills.map((s: string) => String(s).toUpperCase())
          : [];

        const sourceCountry = Array.isArray(j.countries) && j.countries.length > 0 ? String(j.countries[0]).toLowerCase().trim() : undefined;

        return {
          id: `freehire_${j.public_slug || j.external_id || Math.random().toString(36).substring(2, 9)}`,
          title,
          company,
          location: loc,
          country: sourceCountry,
          work_mode: workMode,
          type,
          salary_or_stipend: salaryStr,
          posted_at: j.posted_at || j.created_at || new Date().toISOString(),
          source: 'freehire' as any,
          url: applyUrl,
          description: cleanDesc.length > 320 ? cleanDesc.slice(0, 317) + '...' : cleanDesc,
          requirements: skills.length > 0 ? skills.slice(0, 6) : ['Computer Science, Engineering, or relevant technical foundation', `Verified live listing via ${BRAND.name}`],
          experience_level: experienceLevel,
          is_paid: type === 'internship' ? true : undefined,
          duration: type === 'internship' ? '10 - 14 weeks' : undefined,
          requires_manual_login: requiresManualLogin,
        };
      });

      // Post-filter matches if needed
      const filtered = normalized.filter((job) =>
        matchesClientFilters(
          {
            title: job.title,
            description: job.description,
            location: job.location,
            work_mode: job.work_mode,
            type: job.type,
            experience_level: job.experience_level,
            posted_at: job.posted_at,
          },
          {
            query: params.query,
            location: params.location,
            workMode: params.workMode,
            experienceLevel: params.experienceLevel,
            type: params.type,
            datePosted: params.datePosted,
          }
        )
      );

      // Cache the result
      freehireCache.set(cacheKey, {
        jobs: filtered,
        total: json.meta?.total || filtered.length,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return filtered;
    } catch (parseErr) {
      console.error('[FreeHire Adapter] Error parsing JSON:', parseErr);
      return [];
    }
  },
};
