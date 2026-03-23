import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const holding = await prisma.holding.upsert({
    where: {
      accountId_symbol: {
        accountId: body.accountId,
        symbol: body.symbol
      }
    },
    update: {
      quantity: { increment: body.quantity },
      costBasis: { increment: body.costBasis }
    },
    create: {
      accountId: body.accountId,
      symbol: body.symbol,
      name: body.name,
      quantity: body.quantity,
      costBasis: body.costBasis
    }
  });
  return NextResponse.json(holding, { status: 201 });
}
