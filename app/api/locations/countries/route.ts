import { NextResponse } from 'next/server';
import { getCountriesDataset } from '@/lib/locations';

export async function GET() {
  try {
    const data = getCountriesDataset();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
