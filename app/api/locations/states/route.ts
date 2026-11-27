import { NextResponse } from 'next/server';
import { getStatesDataset, getStateTermForCountry } from '@/lib/locations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    if (!country) {
      return NextResponse.json({ states: [], term: 'States / Regions' });
    }

    const states = getStatesDataset(country);
    const term = getStateTermForCountry(country);

    return NextResponse.json(
      { states, term, country: country.toLowerCase() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
