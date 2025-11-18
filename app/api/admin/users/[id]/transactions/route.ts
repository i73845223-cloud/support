import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await currentUser();
    
    if (!admin?.id || admin.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const userId = params.id;

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        isChatBlocked: true,
        createdAt: true,
      }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const allTransactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const transactionCategory = allTransactions.filter(t => t.category === 'transaction');
    const otherTransactions = allTransactions.filter(t => t.category !== 'transaction');

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

    const calculateProfit = (transactions: any[]) => {
      const successful = transactions.filter(t => t.status === 'success');
      
      const totalDeposits = successful
        .filter(t => t.type === 'deposit')
        .reduce((sum, item) => {
          const amount = item.amount.toNumber ? item.amount.toNumber() : Number(item.amount);
          return sum + amount;
        }, 0);

      const totalWithdrawals = successful
        .filter(t => t.type === 'withdrawal')
        .reduce((sum, item) => {
          const amount = item.amount.toNumber ? item.amount.toNumber() : Number(item.amount);
          return sum + amount;
        }, 0);

      return {
        totalDeposits,
        totalWithdrawals,
        netProfit: totalDeposits - totalWithdrawals,
        transactionCount: successful.length
      };
    };

    const transactionProfit = calculateProfit(transactionCategory);
    const gameProfit = calculateProfit(otherTransactions);

    return NextResponse.json({
      user,
      transactions: {
        all: allTransactions,
        transactionCategory,
        otherCategory: otherTransactions
      },
      balance: {
        available: availableBalance,
        netPending, 
        effective: availableBalance + netPending
      },
      profitMetrics: {
        transaction: transactionProfit,
        game: gameProfit,
        overall: {
          totalDeposits: transactionProfit.totalDeposits + gameProfit.totalDeposits,
          totalWithdrawals: transactionProfit.totalWithdrawals + gameProfit.totalWithdrawals,
          netProfit: transactionProfit.netProfit + gameProfit.netProfit
        }
      }
    });
  } catch (error) {
    console.error('[ADMIN_USER_TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}