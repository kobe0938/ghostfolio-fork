import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const account = await prisma.account.findUnique({
    where: { id },
    include: { holdings: true }
  });
  if (!account)
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(account);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const account = await prisma.account.update({
    where: { id },
    data: {
      name: body.name,
      type: body.type,
      balance: body.balance
    }
  });
  return NextResponse.json(account);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.account.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
