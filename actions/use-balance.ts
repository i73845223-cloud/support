'use client';

import { useState, useCallback, useEffect } from 'react';

export const useBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [displayBalance, setDisplayBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState<boolean>(true);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const response = await fetch('/api/balance');
      if (!response.ok) throw new Error('Failed to fetch balance');
      const data = await response.json();
      const balanceValue = Number(data.balance) || 0;
      setBalance(balanceValue);
      return balanceValue;
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance(0);
      return 0;
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const updateBalance = useCallback(async (amount: number, type: 'deposit' | 'withdrawal') => {
    try {
      const response = await fetch('/api/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, type }),
      });

      if (!response.ok) throw new Error(`Failed to ${type} ${amount}`);
      
      const data = await response.json();
      return data.balance;
    } catch (error) {
      console.error(`Error during ${type}:`, error);
      throw error;
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDisplayBalance(balance);
    }, 300);

    return () => clearTimeout(timeout);
  }, [balance]);

  return {
    balance,
    displayBalance,
    balanceLoading,
    getBalance: fetchBalance,
    updateUserBalance: updateBalance,
  };
};