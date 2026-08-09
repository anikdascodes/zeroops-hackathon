import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { audioAssets } from '@/db/schema';
import { eq } from 'drizzle-orm';

// Cache audio responses aggressively — the key is content-derived, so a
// cached response is never stale.
const CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Content-Type': 'audio/wav',
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params;
  const match = /^([0-9a-f]{16})\.wav$/.exec(file);
  if (!match) return new NextResponse('Not found', { status: 404 });

  try {
    const row = await db.query.audioAssets.findFirst({
      where: eq(audioAssets.id, match[1]),
    });
    if (!row) return new NextResponse('Not found', { status: 404 });
    return new NextResponse(Buffer.from(row.data, 'base64'), { headers: CACHE_HEADERS });
  } catch (e) {
    console.error('Audio DB read error:', e);
    return new NextResponse('Internal error', { status: 500 });
  }
}