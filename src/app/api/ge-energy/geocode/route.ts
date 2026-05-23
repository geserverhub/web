import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/ge-energy/geocode?q=address+Bangkok+Thailand
 * Forward geocode via OpenStreetMap Nominatim (server-side User-Agent).
 */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim();
  if (!q) {
    return NextResponse.json({ success: false, error: 'q parameter is required' }, { status: 400 });
  }

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');
    url.searchParams.set('q', q);

    const res = await fetch(url.toString(), {
      headers: {
        'User-Agent': 'GE-ServerHub/1.0 (goeunserverhub energy-dashboard)',
        Accept: 'application/json',
      },
      next: { revalidate: 0 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Geocode service error (${res.status})` },
        { status: 502 }
      );
    }

    const data = (await res.json()) as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit?.lon) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบพิกัดจากที่อยู่นี้' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      lat: hit.lat,
      lon: hit.lon,
      display_name: hit.display_name,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Geocode failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
