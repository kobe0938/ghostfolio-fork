import { ProxyAgent, setGlobalDispatcher } from 'undici';
import YahooFinance from 'yahoo-finance2';

import { prisma } from './db';

// Route Node fetch through local proxy (needed for macOS system proxy setups)
const proxyUrl = process.env.http_proxy || process.env.https_proxy;
if (proxyUrl) {
  setGlobalDispatcher(new ProxyAgent(proxyUrl));
}

const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
const CACHE_TTL_MS = 5 * 60 * 1000;

export async function getQuotes(
  symbols: { symbol: string; source: 'yahoo' | 'coingecko' }[],
  force = false
): Promise<Record<string, number>> {
  if (symbols.length === 0) return {};

  const now = new Date();
  const cached = force
    ? []
    : await prisma.priceCache.findMany({
        where: { symbol: { in: symbols.map((s) => s.symbol) } }
      });

  const cachedMap: Record<string, { price: number; updatedAt: Date }> = {};
  for (const c of cached) {
    cachedMap[c.symbol] = { price: c.price, updatedAt: c.updatedAt };
  }

  const fresh: Record<string, number> = {};
  const staleYahoo: string[] = [];
  const staleCrypto: string[] = [];

  for (const { symbol, source } of symbols) {
    const entry = cachedMap[symbol];
    if (
      !force &&
      entry &&
      now.getTime() - entry.updatedAt.getTime() < CACHE_TTL_MS
    ) {
      fresh[symbol] = entry.price;
    } else if (source === 'yahoo') {
      staleYahoo.push(symbol);
    } else {
      staleCrypto.push(symbol);
    }
  }

  if (staleYahoo.length > 0) {
    try {
      for (const sym of staleYahoo) {
        const result = await yahooFinance.quote(sym);
        if (result.regularMarketPrice) {
          fresh[sym] = result.regularMarketPrice;
        }
      }
    } catch (e) {
      console.error('Yahoo Finance error:', e);
    }
  }

  if (staleCrypto.length > 0) {
    try {
      const ids = staleCrypto.join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
      );
      const data = await res.json();
      for (const id of staleCrypto) {
        if (data[id]?.usd) {
          fresh[id] = data[id].usd;
        }
      }
    } catch (e) {
      console.error('CoinGecko error:', e);
    }
  }

  // Update cache
  const toUpsert = symbols.filter(
    (s) =>
      (fresh[s.symbol] !== undefined && !cachedMap[s.symbol]?.updatedAt) ||
      (fresh[s.symbol] !== undefined &&
        cachedMap[s.symbol] &&
        now.getTime() - cachedMap[s.symbol].updatedAt.getTime() >= CACHE_TTL_MS)
  );

  await Promise.all(
    toUpsert.map((s) =>
      prisma.priceCache.upsert({
        where: { symbol: s.symbol },
        update: { price: fresh[s.symbol], updatedAt: now },
        create: { symbol: s.symbol, price: fresh[s.symbol], currency: 'USD' }
      })
    )
  );

  // Merge cached + fresh
  for (const { symbol } of symbols) {
    if (fresh[symbol] === undefined && cachedMap[symbol]) {
      fresh[symbol] = cachedMap[symbol].price;
    }
  }

  return fresh;
}
