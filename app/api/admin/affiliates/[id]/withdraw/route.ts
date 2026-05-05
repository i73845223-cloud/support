import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const affiliateId = params.id;

  // Verify the user is an affiliate
  const affiliate = await db.user.findFirst({
    where: { id: affiliateId, role: 'AFFILIATE' },
  });
  if (!affiliate) {
    return NextResponse.json({ error: 'Affiliate not found' }, { status: 404 });
  }

  const body = await request.json();
  const { amount, description } = body;

  const parsedAmount = parseFloat(amount);
  if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
  }

  const transaction = await db.transaction.create({
    data: {
      type: 'withdrawal',
      amount: parsedAmount,
      status: 'success',  // adjust as needed
      description: description || 'Admin withdrawal',
      category: 'admin_affiliate_withdrawal',
      userId: affiliateId,
    },
  });

  return NextResponse.json({ transaction });
}