'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

const TYPES = ['BROKERAGE', 'CRYPTO', 'BANK', 'RETIREMENT', 'CASH', 'DEBT'];
const MANUAL_TYPES = ['BANK', 'RETIREMENT', 'CASH', 'DEBT'];

export default function NewAccountPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState('BROKERAGE');
  const [balance, setBalance] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        type,
        balance: MANUAL_TYPES.includes(type) ? parseFloat(balance) || 0 : 0
      })
    });
    router.push('/accounts');
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">New Account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            placeholder="e.g. Fidelity Brokerage"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {MANUAL_TYPES.includes(type) && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Balance ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="0.00"
            />
          </div>
        )}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Create Account
        </button>
      </form>
    </div>
  );
}
