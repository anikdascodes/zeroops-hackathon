import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    db: !!process.env.DATABASE_URL,
    cache: !!process.env.CACHE_URL,
  });
}
