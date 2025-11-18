import { db } from "@/lib/db";

export const getTransactionsByUserId = async (userId: string) => {
  try {
    // Get user details
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
      return null;
    }

    // Get user transactions
    const allTransactions = await db.transaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    // Separate transactions by category
    const transactionCategory = allTransactions.filter(t => t.category === 'transaction');
    const otherTransactions = allTransactions.filter(t => t.category !== 'transaction');

    // Calculate balances for all transactions
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

    // Calculate profit metrics
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

    return {
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
    };
  } catch (error) {
    console.error('Error getting transactions by user ID:', error);
    return null;
  }
};