import Link from 'next/link';

import './globals.css';

export const metadata = { title: 'WealthFolio Lite' };

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b px-6 py-3 flex gap-6 items-center">
          <Link href="/" className="font-bold text-lg">
            WealthFolio
          </Link>
          <Link href="/" className="text-sm hover:text-blue-600">
            Dashboard
          </Link>
          <Link href="/accounts" className="text-sm hover:text-blue-600">
            Accounts
          </Link>
        </nav>
        <main className="max-w-4xl mx-auto p-6">{children}</main>
      </body>
    </html>
  );
}
