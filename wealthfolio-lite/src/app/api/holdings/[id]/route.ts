import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const holding = await prisma.holding.update({
    where: { id },
    data: {
      quantity: body.quantity,
      costBasis: body.costBasis,
      name: body.name
    }
  });
  return NextResponse.json(holding);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.holding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
