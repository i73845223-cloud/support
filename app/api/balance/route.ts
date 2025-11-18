import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { db } from '@/lib/db';

async function calculateUserBalance(userId: string) {
  const transactions = await db.transaction.findMany({
    where: { 
      userId,
      status: 'success'
    }
  });

  const totalDeposits = transactions
    .filter((item) => item.type === 'deposit')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const totalWithdrawals = transactions
    .filter((item) => item.type === 'withdrawal')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return totalDeposits - totalWithdrawals;
}

export async function GET() {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const balance = await calculateUserBalance(session.user.id);
    return NextResponse.json({ balance });
  } catch (error) {
    console.error('Error calculating balance:', error);
    return NextResponse.json(
      { error: 'Failed to calculate balance' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const { amount, type } = await request.json();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    if (type === 'withdrawal') {
      const currentBalance = await calculateUserBalance(session.user.id);
      if (currentBalance < amount) {
        return NextResponse.json(
          { error: 'Insufficient funds' },
          { status: 400 }
        );
      }
    }

    await db.transaction.create({
      data: {
        userId: session.user.id,
        amount,
        type,
        description: type === 'deposit' 
          ? 'Slot machine win' 
          : 'Slot machine spin',
        category: 'SLOTS',
        status: 'success'
      }
    });

    const updatedBalance = await calculateUserBalance(session.user.id);
    return NextResponse.json({ balance: updatedBalance });
  } catch (error) {
    console.error(`Error during ${type}:`, error);
    return NextResponse.json(
      { error: `Failed to process ${type}` },
      { status: 500 }
    );
  }
}