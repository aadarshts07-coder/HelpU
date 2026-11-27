import { NextResponse } from 'next/server';
import { evidenceService } from '@/lib/certifications/evidence-service';
import { CERTIFICATION_CATALOG_MAP } from '@/lib/data/certifications-catalog';
import { DiscoveredCertification } from '@/lib/certifications/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const certKey = url.searchParams.get('key');

    if (!certKey) {
      return NextResponse.json({ error: 'Certification key is required' }, { status: 400 });
    }

    const cat = CERTIFICATION_CATALOG_MAP.get(certKey);
    if (!cat) {
      return NextResponse.json({ error: `Certification "${certKey}" not found in catalog` }, { status: 404 });
    }

    const cert: DiscoveredCertification = {
      key: cat.key,
      name: cat.name,
      issuer: cat.issuer,
      level: cat.level,
      exam_code: cat.exam_code,
      category: cat.category,
      skills: cat.skills,
      aliases: cat.aliases,
      cost_usd_min: cat.cost_usd_min,
      cost_usd_max: cat.cost_usd_max,
      cost_currency: 'USD',
      is_free: cat.is_free,
      study_weeks: cat.study_weeks,
      validity_years: cat.validity_years,
      difficulty: cat.difficulty,
      official_url: cat.official_url,
      source_name: 'Verified Official Catalog',
      source_url: cat.official_url,
      fetched_at: new Date().toISOString(),
      last_verified_at: cat.last_verified_at,
      confidence: 0.99,
      common_employers: cat.common_employers,
    };

    const evidence = evidenceService.findEvidenceForCertification(cert);

    return NextResponse.json({
      success: true,
      certKey,
      name: cat.name,
      evidence: evidence.evidence,
      matchScoreBefore: evidence.matchScoreBefore,
      matchScoreAfter: evidence.matchScoreAfter,
    });
  } catch (err: any) {
    console.error('[API /api/certifications/evidence] Error:', err);
    return NextResponse.json({ error: err?.message || 'Failed to fetch evidence' }, { status: 500 });
  }
}
