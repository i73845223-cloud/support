"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { formatter } from '@/lib/utils';

export const useBalance = () => {
  const [balance, setBalance] = useState<{
    available: number;
    netPending: number;
    effective: number;
  } | null>(null);
  
  const [formattedBalance, setFormattedBalance] = useState<string>('Loading...');
  const { data: session, status } = useSession();

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (!response.ok) throw new Error('Failed to fetch balance');
      
      const data = await response.json();
      setBalance(data.balance);
      
      let displayText = formatter.format(data.balance.available);
      
      if (data.balance.netPending !== 0) {
        const sign = data.balance.netPending > 0 ? '+' : '-';
        displayText += ` (${sign}${formatter.format(Math.abs(data.balance.netPending))})`;
      }
      
      setFormattedBalance(displayText);
    } catch (error) {
      console.error('Error fetching balance:', error);
      setBalance({
        available: 0,
        netPending: 0,
        effective: 0
      });
      setFormattedBalance(formatter.format(0));
    }
  };

  const updateBalance = async (amount: number, type: 'deposit' | 'withdrawal', status: 'pending' | 'success' = 'pending') => {
    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount, type, status }),
      });
      
      if (!response.ok) throw new Error(`Failed to ${type} ${amount}`);
      
      await fetchBalance();
    } catch (error) {
      console.error(`Error in ${type}:`, error);
      throw error;
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchBalance();
    }
  }, [status]);

  return { 
    balance, 
    formattedBalance, 
    availableBalance: balance?.available ?? 0,
    pendingAmount: balance?.netPending ?? 0,
    isLoading: balance === null,
    updateBalance,
    refreshBalance: fetchBalance 
  };
};