import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const allTransactions = await db.transaction.findMany({
      where: { userId: user.id }
    });

    const successTransactions = allTransactions.filter(t => t.status === 'success');
    const pendingTransactions = allTransactions.filter(t => t.status === 'pending');

    const availableBalance = successTransactions.reduce((sum, item) => {
      const amount = item.amount.toNumber ? item.amount.toNumber() : Number(item.amount);
      return item.type === 'deposit' ? sum + amount : sum - amount;
    }, 0);

    const netPending = pendingTransactions.reduce((sum, item) => {
      const amount = item.amount.toNumber ? item.amount.toNumber() : Number(item.amount);
      return item.type === 'deposit' ? sum + amount : sum - amount;
    }, 0);

    return NextResponse.json({ 
      transactions: allTransactions,
      balance: {
        available: availableBalance,
        netPending, 
        effective: availableBalance
      }
    });
  } catch (error) {
    console.log('[TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { amount, type, description, category } = await req.json();

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new NextResponse("Invalid amount", { status: 400 });
    }

    const transaction = await db.transaction.create({
      data: {
        userId: user.id,
        amount,
        type,
        description: description || `Slot machine ${type}`,
        category: category || 'slots',
        status: 'success'
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.log('[TRANSACTIONS_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}