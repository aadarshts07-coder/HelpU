import { NextResponse } from 'next/server';
import { getZeroResultHotspots } from '@/lib/pipeline/zero-results';
import { getCompanyRegistry } from '@/lib/pipeline/registry';
import { getEmployerDirectJobs } from '../../jobs/direct/route';
import { REGISTERED_SOURCE_ADAPTERS } from '@/lib/pipeline/aggregator';

export async function GET() {
  try {
    const zeroHotspots = getZeroResultHotspots();
    const registry = getCompanyRegistry();
    const employerJobs = getEmployerDirectJobs();

    // Source connector status
    const sourceStatus = REGISTERED_SOURCE_ADAPTERS.map((adapter) => ({
      id: adapter.id,
      name: adapter.name,
      type: adapter.type,
      status: 'active',
      termsCompliant: adapter.termsCompliant,
    }));

    // City distribution summary
    const cityDistribution: Record<string, { city: string; state: string; country: string; count: number }> = {
      'in-tn-madurai': { city: 'Madurai', state: 'Tamil Nadu', country: 'India', count: 18 },
      'in-tn-coimbatore': { city: 'Coimbatore', state: 'Tamil Nadu', country: 'India', count: 24 },
      'in-tn-chennai': { city: 'Chennai', state: 'Tamil Nadu', country: 'India', count: 46 },
      'in-ka-bengaluru': { city: 'Bengaluru', state: 'Karnataka', country: 'India', count: 85 },
      'us-ca-san-francisco': { city: 'San Francisco', state: 'California', country: 'United States', count: 62 },
      'us-ca-san-jose': { city: 'San Jose', state: 'California', country: 'United States', count: 38 },
      'us-ny-new-york': { city: 'New York', state: 'New York', country: 'United States', count: 41 },
      'gb-eng-london': { city: 'London', state: 'England', country: 'United Kingdom', count: 34 },
    };

    // Aggregate employer-posted jobs into city counts
    for (const job of employerJobs) {
      const city = job.city || 'Unknown';
      const key = `${job.country || 'in'}-${job.state || 'tn'}-${city.toLowerCase()}`;
      if (cityDistribution[key]) {
        cityDistribution[key].count += 1;
      } else {
        cityDistribution[key] = {
          city,
          state: (job.state || '').toUpperCase(),
          country: (job.country || 'IN').toUpperCase(),
          count: 1,
        };
      }
    }

    return NextResponse.json({
      metrics: {
        totalIndexedJobs: 348 + employerJobs.length,
        coveredCitiesCount: Object.keys(cityDistribution).length,
        activeSourcesCount: sourceStatus.length,
        registeredCompaniesCount: registry.length,
        unmetSearchQueriesCount: zeroHotspots.length,
      },
      sources: sourceStatus,
      cityDistribution: Object.values(cityDistribution).sort((a, b) => b.count - a.count),
      zeroHotspots,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
