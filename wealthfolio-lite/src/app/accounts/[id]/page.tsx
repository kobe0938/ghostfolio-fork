'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type Holding = {
  id: string;
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

const MANUAL_TYPES = ['BANK', 'RETIREMENT', 'CASH', 'DEBT'];

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [account, setAccount] = useState<Account | null>(null);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [balance, setBalance] = useState('');

  // Add holding form
  const [symbol, setSymbol] = useState('');
  const [holdingName, setHoldingName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [costBasis, setCostBasis] = useState('');

  useEffect(() => {
    loadAccount();
  }, [id]);

  async function loadAccount() {
    const res = await fetch(`/api/accounts/${id}`);
    const data: Account = await res.json();
    setAccount(data);
    setBalance(String(data.balance));

    if (data.holdings.length > 0) {
      const source = data.type === 'CRYPTO' ? 'coingecko' : 'yahoo';
      const symbols = data.holdings.map((h) => h.symbol).join(',');
      const r = await fetch(`/api/prices?symbols=${symbols}&source=${source}`);
      setPrices(await r.json());
    }
  }

  async function updateBalance() {
    await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ balance: parseFloat(balance) || 0 })
    });
    loadAccount();
  }

  async function addHolding(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/holdings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: id,
        symbol: symbol.trim(),
        name: holdingName.trim(),
        quantity: parseFloat(quantity) || 0,
        costBasis: parseFloat(costBasis) || 0
      })
    });
    setSymbol('');
    setHoldingName('');
    setQuantity('');
    setCostBasis('');
    loadAccount();
  }

  async function deleteHolding(holdingId: string) {
    await fetch(`/api/holdings/${holdingId}`, { method: 'DELETE' });
    loadAccount();
  }

  async function deleteAccount() {
    if (!confirm('Delete this account?')) return;
    await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
    router.push('/accounts');
  }

  if (!account)
    return <p className="text-center mt-20 text-gray-500">Loading...</p>;

  const isManual = MANUAL_TYPES.includes(account.type);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">{account.name}</h1>
          <p className="text-sm text-gray-500">{account.type}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/accounts/${id}/edit`}
            className="text-sm px-3 py-1.5 border rounded hover:bg-gray-50"
          >
            Edit
          </Link>
          <button
            onClick={deleteAccount}
            className="text-sm px-3 py-1.5 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      {isManual ? (
        <div className="bg-white rounded-lg p-6 border">
          <label className="block text-sm font-medium mb-2">Balance ($)</label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="border rounded px-3 py-2 flex-1"
            />
            <button
              onClick={updateBalance}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Holdings Table */}
          <div className="bg-white rounded-lg border overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3">Symbol</th>
                  <th className="text-left p-3">Name</th>
                  <th className="text-right p-3">Qty</th>
                  <th className="text-right p-3">Price</th>
                  <th className="text-right p-3">Value</th>
                  <th className="text-right p-3">Gain/Loss</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {account.holdings.map((h) => {
                  const price = prices[h.symbol] ?? 0;
                  const value = h.quantity * price;
                  const gain = value - h.costBasis;
                  return (
                    <tr key={h.id} className="border-b last:border-0">
                      <td className="p-3 font-mono">{h.symbol}</td>
                      <td className="p-3">{h.name}</td>
                      <td className="p-3 text-right">{h.quantity}</td>
                      <td className="p-3 text-right">${price.toFixed(2)}</td>
                      <td className="p-3 text-right">${value.toFixed(2)}</td>
                      <td
                        className={`p-3 text-right ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {gain >= 0 ? '+' : ''}${gain.toFixed(2)}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => deleteHolding(h.id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {account.holdings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-3 text-center text-gray-500">
                      No holdings yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Holding Form */}
          <div className="bg-white rounded-lg p-4 border">
            <h3 className="font-medium mb-3">Add Holding</h3>
            <form onSubmit={addHolding} className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder={
                  account.type === 'CRYPTO' ? 'e.g. bitcoin' : 'e.g. AAPL'
                }
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="text"
                placeholder="Name (e.g. Apple Inc.)"
                value={holdingName}
                onChange={(e) => setHoldingName(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="any"
                placeholder="Quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="Total Cost ($)"
                value={costBasis}
                onChange={(e) => setCostBasis(e.target.value)}
                className="border rounded px-3 py-2"
                required
              />
              <button
                type="submit"
                className="col-span-2 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Add
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
