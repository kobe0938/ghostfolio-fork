'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Account = { id: string; name: string; type: string; balance: number };

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    fetch('/api/accounts')
      .then((r) => r.json())
      .then(setAccounts);
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Accounts</h1>
        <Link
          href="/accounts/new"
          className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700"
        >
          + New Account
        </Link>
      </div>
      <div className="space-y-2">
        {accounts.map((a) => (
          <Link
            key={a.id}
            href={`/accounts/${a.id}`}
            className="block bg-white p-4 rounded border hover:border-blue-300"
          >
            <span className="font-medium">{a.name}</span>
            <span className="text-gray-500 text-sm ml-2">({a.type})</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
