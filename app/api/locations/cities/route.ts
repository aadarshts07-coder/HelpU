import { NextResponse } from 'next/server';
import { getCitiesDataset } from '@/lib/locations';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const country = searchParams.get('country') || '';
    const state = searchParams.get('state') || undefined;

    if (!country) {
      return NextResponse.json({ cities: [] });
    }

    const cities = getCitiesDataset(country, state);

    return NextResponse.json(
      { cities, country: country.toLowerCase(), state: state?.toLowerCase() },
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
