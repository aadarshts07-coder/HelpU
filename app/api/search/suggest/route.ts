import { NextResponse } from 'next/server';

interface SuggestionResult {
  text: string;
  kind?: string;
  jobs?: number;
}

interface LiveJobPreview {
  id: string;
  title: string;
  company: string;
  location: string;
  workMode: string;
  url: string;
  type: 'job' | 'internship';
}

const cache = new Map<string, { data: { suggestions: SuggestionResult[]; liveJobs: LiveJobPreview[] }; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [], liveJobs: [] });
    }

    const cacheKey = q.toLowerCase();
    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.data);
    }

    // Parallel fetch from freehire suggest and search endpoints
    const [suggestRes, searchRes] = await Promise.allSettled([
      fetch(`https://freehire.me/api/v1/suggest?q=${encodeURIComponent(q)}&limit=6`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 HelpU-Search/1.0',
        },
        signal: AbortSignal.timeout(3500),
      }),
      fetch(`https://freehire.me/api/v1/jobs/search?q=${encodeURIComponent(q)}&limit=3`, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 HelpU-Search/1.0',
        },
        signal: AbortSignal.timeout(3500),
      }),
    ]);

    let suggestions: SuggestionResult[] = [];
    if (suggestRes.status === 'fulfilled' && suggestRes.value.ok) {
      try {
        const json = await suggestRes.value.json();
        if (Array.isArray(json.data)) {
          suggestions = json.data.map((item: any) => ({
            text: item.text,
            kind: item.parts?.[0]?.kind || 'role',
            jobs: item.jobs || 0,
          }));
        }
      } catch (e) {
        console.warn('Error parsing suggest data:', e);
      }
    }

    let liveJobs: LiveJobPreview[] = [];
    if (searchRes.status === 'fulfilled' && searchRes.value.ok) {
      try {
        const json = await searchRes.value.json();
        if (Array.isArray(json.data)) {
          liveJobs = json.data.map((j: any) => {
            const isIntern = /intern(ship)?|trainee/i.test(j.title || '');
            return {
              id: j.public_slug || j.external_id || Math.random().toString(),
              title: j.title || 'Tech Role',
              company: j.company || 'Direct Employer',
              location: j.location || 'Remote',
              workMode: j.work_mode || (j.location?.toLowerCase().includes('remote') ? 'remote' : 'onsite'),
              url: j.url || `https://freehire.me/jobs/${j.public_slug}`,
              type: isIntern ? 'internship' : 'job',
            };
          });
        }
      } catch (e) {
        console.warn('Error parsing search preview data:', e);
      }
    }

    const result = { suggestions, liveJobs };
    cache.set(cacheKey, { data: result, expiresAt: Date.now() + CACHE_TTL });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ suggestions: [], liveJobs: [], error: error.message }, { status: 200 });
  }
}
