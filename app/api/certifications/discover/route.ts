import { NextResponse } from 'next/server';
import { z } from 'zod';
import { parseGoalUnderstanding } from '@/lib/certifications/goal-parser';
import { defaultAdapterRegistry } from '@/lib/certifications/adapters/registry';
import { rankCertificationsForGoal } from '@/lib/certifications/ranking-service';
import { getCachedCertifications, setCachedCertifications } from '@/lib/certifications/cache-service';
import { db } from '@/lib/db';
import { fetchGoalCertificationsFromSupabase } from '@/lib/supabase';
import { DiscoverResponse } from '@/lib/certifications/types';

const DiscoverRequestSchema = z.object({
  goal: z.string().min(2, 'Goal must be at least 2 characters'),
  timeline: z.string().optional().default('3 months'),
  skills: z.array(z.string()).optional().default([]),
  analysisId: z.string().optional(),
});

// Rate limiting map
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const MAX_REQUESTS = 15;

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const userIdMatch = cookieHeader.match(/helpu_session=([^;]+)/);
    const userId = userIdMatch && userIdMatch[1] !== 'logged_out' ? userIdMatch[1].trim() : 'usr_demo_101';
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

    // Rate Limit Check
    const rateCheck = checkRateLimit(`disc_${userId}_${ip}`);
    if (!rateCheck.allowed) {
      console.warn(`[API /api/certifications/discover] Rate limit exceeded for user ${userId} (${ip})`);
      return NextResponse.json(
        { error: `Too many requests. Please retry in ${rateCheck.retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const parseResult = DiscoverRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { goal, timeline, skills, analysisId } = parseResult.data;
    const cacheKey = `disc_${goal.toLowerCase().trim()}_${timeline}`;

    // 1. Check Stale-While-Revalidate Cache
    const { response: cached, isStale } = getCachedCertifications(cacheKey);

    // If fresh cache exists, return immediately
    if (cached && !isStale) {
      return NextResponse.json({ ...cached, cached: true });
    }

    // 2. Perform Discovery Pipeline
    console.log(`[API /api/certifications/discover] Running discovery pipeline for "${goal}" (${timeline})...`);

    // Step A: Understand Goal with Claude / Heuristic
    const understanding = await parseGoalUnderstanding(goal, timeline, skills);

    // Step B: Fetch and merge from isolated pluggable adapters
    const discovered = await defaultAdapterRegistry.discoverAll(understanding);

    // Step C: Rank and gather employer evidence
    const { ranked, spotlight } = rankCertificationsForGoal(discovered, understanding, timeline, skills);

    // Step D: Join user's existing certification statuses if analysisId or userId is provided
    try {
      const [supaCerts, localCerts] = await Promise.all([
        fetchGoalCertificationsFromSupabase(userId, analysisId).catch(() => []),
        db.getGoalCertifications(userId, analysisId).catch(() => []),
      ]);
      const statusMap = new Map<string, any>();
      [...localCerts, ...supaCerts].forEach((c) => {
        statusMap.set(c.cert_key, c);
      });

      ranked.forEach((r) => {
        const userRec = statusMap.get(r.key);
        if (userRec) {
          r.userStatus = userRec.status;
          r.targetDate = userRec.target_date;
          r.earnedDate = userRec.earned_date;
        }
      });
    } catch (err) {
      console.warn('[API /api/certifications/discover] Could not join user statuses:', err);
    }

    // Calculate aggregate hiring companies count
    const uniqueCompanies = new Set<string>();
    ranked.forEach((c) => {
      c.evidence?.topEmployers?.forEach((e) => uniqueCompanies.add(e.company));
    });

    const responseData: DiscoverResponse = {
      success: true,
      goal,
      understanding,
      totalFound: ranked.length,
      totalCompaniesHiring: uniqueCompanies.size,
      certifications: ranked,
      spotlightCert: spotlight,
      cached: false,
      lastUpdatedAt: new Date().toISOString(),
    };

    // Cache results for 7 days
    setCachedCertifications(cacheKey, responseData);

    return NextResponse.json(responseData);
  } catch (err: any) {
    console.error('[API /api/certifications/discover] Pipeline error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to discover certifications' },
      { status: 500 }
    );
  }
}
