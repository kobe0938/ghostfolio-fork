'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Holding = {
  symbol: string;
  name: string;
  quantity: number;
  costBasis: number;
};
type Account = {
  id: string;
  name: string;
  type: string;
  balance: number;
  holdings: Holding[];
};

const TYPE_LABELS: Record<string, string> = {
  BROKERAGE: 'Brokerage',
  CRYPTO: 'Crypto',
  BANK: 'Bank',
  RETIREMENT: '401k/Retirement',
  CASH: 'Cash',
  DEBT: 'Debt'
};

const TYPE_ORDER = [
  'BROKERAGE',
  'CRYPTO',
  'BANK',
  'RETIREMENT',
  'CASH',
  'DEBT'
];

const BAR_COLORS: Record<string, string> = {
  BROKERAGE: 'bg-blue-500',
  CRYPTO: 'bg-purple-500',
  BANK: 'bg-green-500',
  RETIREMENT: 'bg-yellow-500',
  CASH: 'bg-gray-400',
  DEBT: 'bg-red-500'
};

const TYPE_COLORS: Record<string, string> = {
  BROKERAGE: 'bg-blue-100 text-blue-800',
  CRYPTO: 'bg-purple-100 text-purple-800',
  BANK: 'bg-green-100 text-green-800',
  RETIREMENT: 'bg-yellow-100 text-yellow-800',
  CASH: 'bg-gray-100 text-gray-800',
  DEBT: 'bg-red-100 text-red-800'
};

const DOT_COLORS: Record<string, string> = {
  BROKERAGE: 'bg-blue-500',
  CRYPTO: 'bg-purple-500',
  BANK: 'bg-green-500',
  RETIREMENT: 'bg-yellow-500',
  CASH: 'bg-gray-400',
  DEBT: 'bg-red-500'
};

function fmt(n: number) {
  return Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export default function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshedAt, setRefreshedAt] = useState<Date | null>(null);

  async function loadData(force = false) {
    const res = await fetch('/api/accounts');
    const data: Account[] = await res.json();
    setAccounts(data);

    const yahooSymbols: string[] = [];
    const cryptoSymbols: string[] = [];
    for (const a of data) {
      for (const h of a.holdings) {
        if (a.type === 'CRYPTO') cryptoSymbols.push(h.symbol);
        else yahooSymbols.push(h.symbol);
      }
    }

    const forceParam = force ? '&force=1' : '';
    const allPrices: Record<string, number> = {};
    const fetches: Promise<void>[] = [];
    if (yahooSymbols.length > 0) {
      fetches.push(
        fetch(
          `/api/prices?symbols=${[...new Set(yahooSymbols)].join(',')}&source=yahoo${forceParam}`
        )
          .then((r) => r.json())
          .then((p) => Object.assign(allPrices, p))
      );
    }
    if (cryptoSymbols.length > 0) {
      fetches.push(
        fetch(
          `/api/prices?symbols=${[...new Set(cryptoSymbols)].join(',')}&source=coingecko${forceParam}`
        )
          .then((r) => r.json())
          .then((p) => Object.assign(allPrices, p))
      );
    }
    await Promise.all(fetches);
    setPrices(allPrices);
    setRefreshedAt(new Date());
  }

  useEffect(() => {
    loadData().then(() => setLoading(false));
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    await loadData(true);
    setRefreshing(false);
  }

  function accountValue(a: Account): number {
    if (['BANK', 'RETIREMENT', 'CASH', 'DEBT'].includes(a.type)) {
      return a.balance;
    }
    return a.holdings.reduce(
      (sum, h) => sum + h.quantity * (prices[h.symbol] ?? 0),
      0
    );
  }

  // Group accounts by type and compute totals
  const byType: Record<
    string,
    { total: number; accounts: (Account & { value: number })[] }
  > = {};
  let netWorth = 0;
  let totalAssets = 0;

  for (const a of accounts) {
    const val = accountValue(a);
    if (!byType[a.type]) byType[a.type] = { total: 0, accounts: [] };
    byType[a.type].total += val;
    byType[a.type].accounts.push({ ...a, value: val });
    netWorth += a.type === 'DEBT' ? -val : val;
    totalAssets += Math.abs(val);
  }

  if (loading) {
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;
  }

  // Sorted types that exist
  const activeTypes = TYPE_ORDER.filter((t) => byType[t]);

  return (
    <div>
      {/* Net Worth Header */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 uppercase tracking-wide">
          Net Worth
        </p>
        <p className="text-4xl font-bold mt-1">${fmt(netWorth)}</p>
        <div className="mt-3 flex items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh Prices'}
          </button>
          {refreshedAt && (
            <span className="text-xs text-gray-400">
              Refreshed at {refreshedAt.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Allocation Bar */}
      {totalAssets > 0 && (
        <div className="mb-6">
          <div className="flex rounded-full overflow-hidden h-4">
            {activeTypes.map((type) => {
              const pct = (Math.abs(byType[type].total) / totalAssets) * 100;
              if (pct < 0.5) return null;
              return (
                <div
                  key={type}
                  className={`${BAR_COLORS[type]} transition-all`}
                  style={{ width: `${pct}%` }}
                  title={`${TYPE_LABELS[type]}: ${pct.toFixed(1)}%`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 justify-center">
            {activeTypes.map((type) => {
              const pct =
                totalAssets > 0
                  ? (Math.abs(byType[type].total) / totalAssets) * 100
                  : 0;
              return (
                <div
                  key={type}
                  className="flex items-center gap-1.5 text-xs text-gray-600"
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${DOT_COLORS[type]}`}
                  />
                  {TYPE_LABELS[type]} {pct.toFixed(1)}%
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grouped by Type */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Accounts</h2>
        <Link
          href="/accounts/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Account
        </Link>
      </div>

      {accounts.length === 0 ? (
        <p className="text-gray-500">
          No accounts yet. Create one to get started.
        </p>
      ) : (
        <div className="space-y-6">
          {activeTypes.map((type) => {
            const group = byType[type];
            return (
              <div key={type}>
                {/* Group Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${DOT_COLORS[type]}`}
                    />
                    <h3 className="font-semibold text-sm text-gray-700">
                      {TYPE_LABELS[type]}
                    </h3>
                  </div>
                  <p className="font-semibold text-sm">
                    {type === 'DEBT' ? '-' : ''}${fmt(group.total)}
                  </p>
                </div>

                {/* Account Cards in Group */}
                <div className="space-y-2 ml-5">
                  {group.accounts.map((a) => (
                    <Link
                      key={a.id}
                      href={`/accounts/${a.id}`}
                      className="flex justify-between items-center bg-white rounded-lg p-3 border hover:border-blue-300 transition"
                    >
                      <div>
                        <p className="font-medium text-sm">{a.name}</p>
                        {['BROKERAGE', 'CRYPTO'].includes(a.type) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {a.holdings.length} holding
                            {a.holdings.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <p className="font-semibold">
                        {a.type === 'DEBT' ? '-' : ''}${fmt(a.value)}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
