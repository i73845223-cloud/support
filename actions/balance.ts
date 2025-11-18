"use server"

import { db } from '@/lib/db';
import { formatter } from '@/lib/utils';

export const useBalance = async () => {
  const transactions = await db.transaction.findMany();

    const successfulTransactions = transactions.filter(
    (item) => item.status === 'success'
    );

    const totalDeposits = successfulTransactions
    .filter((item) => item.type === 'deposit')
    .reduce((sum, item) => sum + Number(item.amount), 0);

    const totalWithdrawals = successfulTransactions
    .filter((item) => item.type === 'withdrawal')
    .reduce((sum, item) => sum + Number(item.amount), 0);

    const balance = totalDeposits - totalWithdrawals;

  return formatter.format(Number(balance))
}