import { getQuotes } from '@/lib/prices';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get('symbols') ?? '';
  const source = searchParams.get('source') ?? 'yahoo';

  if (!raw) return NextResponse.json({});

  const symbols = raw.split(',').map((s) => ({
    symbol: s.trim(),
    source: source as 'yahoo' | 'coingecko'
  }));

  const force = searchParams.get('force') === '1';
  const prices = await getQuotes(symbols, force);
  return NextResponse.json(prices);
}
