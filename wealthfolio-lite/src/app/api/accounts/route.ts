import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const accounts = await prisma.account.findMany({
    include: { holdings: true },
    orderBy: { createdAt: 'asc' }
  });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const body = await req.json();
  const account = await prisma.account.create({
    data: {
      name: body.name,
      type: body.type,
      balance: body.balance ?? 0,
      currency: body.currency ?? 'USD'
    }
  });
  return NextResponse.json(account, { status: 201 });
}
