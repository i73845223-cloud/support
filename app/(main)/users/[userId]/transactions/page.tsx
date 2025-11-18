"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  IndianRupee, 
  Download, 
  CreditCard, 
  GamepadIcon, 
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  XCircle,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { formatter } from "@/lib/utils";

interface Transaction {
  id: string;
  type: string;
  amount: any;
  status: string;
  createdAt: string;
  updatedAt: string;
  description: string | null;
  category: string | null;
  userId: string;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isBlocked: boolean;
  isChatBlocked: boolean;
  createdAt: string;
}

interface UserBalance {
  available: number;
  netPending: number;
  effective: number;
}

interface ProfitMetrics {
  transaction: {
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
    transactionCount: number;
  };
  game: {
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
    transactionCount: number;
  };
  overall: {
    totalDeposits: number;
    totalWithdrawals: number;
    netProfit: number;
  };
}

interface UserTransactionsData {
  user: User;
  transactions: {
    all: Transaction[];
    transactionCategory: Transaction[];
    otherCategory: Transaction[];
  };
  balance: UserBalance;
  profitMetrics: ProfitMetrics;
}

interface UserTransactionsPageProps {
  params: {
    userId: string;
  };
}

const UserTransactionsPage = ({ params }: UserTransactionsPageProps) => {
  const { userId } = params;
  const [data, setData] = useState<UserTransactionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("transaction");
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    status: "all",
    startDate: "",
    endDate: "",
    search: ""
  });

  const [manualTransactionOpen, setManualTransactionOpen] = useState(false);
  const [creatingTransaction, setCreatingTransaction] = useState(false);
  const [manualTransactionData, setManualTransactionData] = useState({
    type: 'deposit',
    amount: '',
    status: 'success'
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchUserTransactions();
  }, [userId]);

  const fetchUserTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users/${userId}/transactions`);
      if (response.ok) {
        const transactionsData = await response.json();
        setData(transactionsData);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transactions');
    } finally {
      setLoading(false);
    }
  };

  const updateTransactionStatus = async (transactionId: string, status: string) => {
    try {
      setUpdating(transactionId);
      
      const response = await fetch('/api/admin/transactions', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId, status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const updatedTransaction = await response.json();

      setData(prevData => {
        if (!prevData) return null;
        
        const updateTransactions = (transactions: Transaction[]) => 
          transactions.map(t => t.id === transactionId ? updatedTransaction : t);
        
        return {
          ...prevData,
          transactions: {
            all: updateTransactions(prevData.transactions.all),
            transactionCategory: updateTransactions(prevData.transactions.transactionCategory),
            otherCategory: updateTransactions(prevData.transactions.otherCategory)
          }
        };
      });

      toast.success(`Status updated to ${getStatusText(status)}`);
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const createManualTransaction = async () => {
    try {
      setCreatingTransaction(true);

      const amount = parseFloat(manualTransactionData.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount greater than 0');
        return;
      }

      const response = await fetch('/api/admin/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: manualTransactionData.type,
          amount,
          status: manualTransactionData.status
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP Error: ${response.status}`);
      }

      const newTransaction = await response.json();

      setData(prevData => {
        if (!prevData) return null;
        
        const addTransaction = (transactions: Transaction[]) => 
          [newTransaction, ...transactions];
        
        return {
          ...prevData,
          transactions: {
            all: addTransaction(prevData.transactions.all),
            transactionCategory: addTransaction(prevData.transactions.transactionCategory),
            otherCategory: prevData.transactions.otherCategory
          },
          balance: {
            ...prevData.balance,
            available: manualTransactionData.status === 'success' 
              ? manualTransactionData.type === 'deposit' 
                ? prevData.balance.available + amount
                : prevData.balance.available - amount
              : prevData.balance.available,
            netPending: manualTransactionData.status === 'pending'
              ? manualTransactionData.type === 'deposit'
                ? prevData.balance.netPending + amount
                : prevData.balance.netPending - amount
              : prevData.balance.netPending,
            effective: manualTransactionData.status === 'success'
              ? manualTransactionData.type === 'deposit'
                ? prevData.balance.effective + amount
                : prevData.balance.effective - amount
              : manualTransactionData.status === 'pending'
                ? manualTransactionData.type === 'deposit'
                  ? prevData.balance.effective + amount
                  : prevData.balance.effective - amount
                : prevData.balance.effective
          },
          profitMetrics: manualTransactionData.status === 'success' ? {
            ...prevData.profitMetrics,
            transaction: {
              ...prevData.profitMetrics.transaction,
              totalDeposits: manualTransactionData.type === 'deposit'
                ? prevData.profitMetrics.transaction.totalDeposits + amount
                : prevData.profitMetrics.transaction.totalDeposits,
              totalWithdrawals: manualTransactionData.type === 'withdrawal'
                ? prevData.profitMetrics.transaction.totalWithdrawals + amount
                : prevData.profitMetrics.transaction.totalWithdrawals,
              netProfit: manualTransactionData.type === 'deposit'
                ? prevData.profitMetrics.transaction.netProfit + amount
                : prevData.profitMetrics.transaction.netProfit - amount,
              transactionCount: prevData.profitMetrics.transaction.transactionCount + 1
            },
            overall: {
              ...prevData.profitMetrics.overall,
              totalDeposits: manualTransactionData.type === 'deposit'
                ? prevData.profitMetrics.overall.totalDeposits + amount
                : prevData.profitMetrics.overall.totalDeposits,
              totalWithdrawals: manualTransactionData.type === 'withdrawal'
                ? prevData.profitMetrics.overall.totalWithdrawals + amount
                : prevData.profitMetrics.overall.totalWithdrawals,
              netProfit: manualTransactionData.type === 'deposit'
                ? prevData.profitMetrics.overall.netProfit + amount
                : prevData.profitMetrics.overall.netProfit - amount
            }
          } : prevData.profitMetrics
        };
      });

      setManualTransactionData({
        type: 'deposit',
        amount: '',
        status: 'success'
      });
      setManualTransactionOpen(false);

      toast.success(`Manual ${manualTransactionData.type} created successfully`);
    } catch (error) {
      console.error('Failed to create manual transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setCreatingTransaction(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'fail':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'pending':
        return 'Pending';
      case 'fail':
        return 'Failed';
      default:
        return status;
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Deposit';
      case 'withdrawal':
        return 'Withdrawal';
      default:
        return type;
    }
  };

  const getAmountColor = (type: string) => {
    return type === 'deposit' ? 'text-green-600' : 'text-red-600';
  };

  const formatAmount = (amount: any): number => {
    if (typeof amount === 'number') return amount;
    if (amount && typeof amount.toNumber === 'function') return amount.toNumber();
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const filterTransactions = (transactions: Transaction[]) => {
    return transactions.filter(transaction => {
      if (filters.status !== "all" && transaction.status !== filters.status) {
        return false;
      }

      const transactionDate = new Date(transaction.createdAt);
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        if (transactionDate < startDate) return false;
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (transactionDate > endDate) return false;
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesId = transaction.id.toLowerCase().includes(searchLower);
        const matchesDescription = transaction.description?.toLowerCase().includes(searchLower) || false;
        const matchesAmount = formatAmount(transaction.amount).toString().includes(searchLower);
        const matchesType = transaction.type.toLowerCase().includes(searchLower);
        
        if (!matchesId && !matchesDescription && !matchesAmount && !matchesType) {
          return false;
        }
      }

      return true;
    });
  };

  const getCurrentTransactions = () => {
    if (!data) return [];
    
    const sourceTransactions = activeTab === "transaction" 
      ? data.transactions.transactionCategory 
      : data.transactions.otherCategory;
    
    const filtered = filterTransactions(sourceTransactions);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalFilteredCount = () => {
    if (!data) return 0;
    
    const sourceTransactions = activeTab === "transaction" 
      ? data.transactions.transactionCategory 
      : data.transactions.otherCategory;
    
    return filterTransactions(sourceTransactions).length;
  };

  const getTotalPages = () => {
    return Math.ceil(getTotalFilteredCount() / itemsPerPage);
  };

  const downloadCSV = () => {
    if (!data) return;

    const sourceTransactions = activeTab === "transaction" 
      ? data.transactions.transactionCategory 
      : data.transactions.otherCategory;
    
    const filteredTransactions = filterTransactions(sourceTransactions);
    
    const csvHeaders = ["Date", "Type", "Description", "Category", "Amount", "Status", "Transaction ID"];
    const csvData = filteredTransactions.map(transaction => [
      format(new Date(transaction.createdAt), "yyyy-MM-dd HH:mm:ss"),
      getTypeText(transaction.type),
      `"${(transaction.description || "No description").replace(/"/g, '""')}"`,
      transaction.category || "Uncategorized",
      formatAmount(transaction.amount),
      getStatusText(transaction.status),
      transaction.id
    ]);

    const csvContent = [csvHeaders, ...csvData]
      .map(row => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${activeTab}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Exported ${filteredTransactions.length} transactions`);
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      startDate: "",
      endDate: "",
      search: ""
    });
    setCurrentPage(1);
  };

  const StatusDropdown = ({ transaction }: { transaction: Transaction }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={updating === transaction.id}
        >
          {updating === transaction.id ? (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current"></div>
          ) : (
            <>
              {getStatusIcon(transaction.status)}
              <span className="font-medium">{getStatusText(transaction.status)}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => updateTransactionStatus(transaction.id, 'success')}
          className="flex items-center gap-2"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          Success
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateTransactionStatus(transaction.id, 'pending')}
          className="flex items-center gap-2"
        >
          <Clock className="h-4 w-4 text-yellow-600" />
          Pending
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => updateTransactionStatus(transaction.id, 'fail')}
          className="flex items-center gap-2"
        >
          <XCircle className="h-4 w-4 text-red-600" />
          Failed
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

const ManualTransactionDialog = () => {
  const [localTransactionData, setLocalTransactionData] = useState({
    type: 'deposit' as 'deposit' | 'withdrawal',
    amount: '',
    status: 'success' as 'success' | 'pending' | 'fail'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(localTransactionData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount greater than 0');
      return;
    }

    setCreatingTransaction(true);

    try {
      const response = await fetch('/api/admin/transactions/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          type: localTransactionData.type,
          amount,
          status: localTransactionData.status
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to create transaction';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP Error: ${response.status}`;
        }
        throw new Error(errorMessage);
      }

      const newTransaction = await response.json();

      setData(prevData => {
        if (!prevData) return null;
        
        const addTransaction = (transactions: Transaction[]) => 
          [newTransaction, ...transactions];
        
        return {
          ...prevData,
          transactions: {
            all: addTransaction(prevData.transactions.all),
            transactionCategory: addTransaction(prevData.transactions.transactionCategory),
            otherCategory: prevData.transactions.otherCategory
          },
          balance: {
            ...prevData.balance,
            available: localTransactionData.status === 'success' 
              ? localTransactionData.type === 'deposit' 
                ? prevData.balance.available + amount
                : prevData.balance.available - amount
              : prevData.balance.available,
            netPending: localTransactionData.status === 'pending'
              ? localTransactionData.type === 'deposit'
                ? prevData.balance.netPending + amount
                : prevData.balance.netPending - amount
              : prevData.balance.netPending,
            effective: localTransactionData.status === 'success'
              ? localTransactionData.type === 'deposit'
                ? prevData.balance.effective + amount
                : prevData.balance.effective - amount
              : localTransactionData.status === 'pending'
                ? localTransactionData.type === 'deposit'
                  ? prevData.balance.effective + amount
                  : prevData.balance.effective - amount
                : prevData.balance.effective
          },
          profitMetrics: localTransactionData.status === 'success' ? {
            ...prevData.profitMetrics,
            transaction: {
              ...prevData.profitMetrics.transaction,
              totalDeposits: localTransactionData.type === 'deposit'
                ? prevData.profitMetrics.transaction.totalDeposits + amount
                : prevData.profitMetrics.transaction.totalDeposits,
              totalWithdrawals: localTransactionData.type === 'withdrawal'
                ? prevData.profitMetrics.transaction.totalWithdrawals + amount
                : prevData.profitMetrics.transaction.totalWithdrawals,
              netProfit: localTransactionData.type === 'deposit'
                ? prevData.profitMetrics.transaction.netProfit + amount
                : prevData.profitMetrics.transaction.netProfit - amount,
              transactionCount: prevData.profitMetrics.transaction.transactionCount + 1
            },
            overall: {
              ...prevData.profitMetrics.overall,
              totalDeposits: localTransactionData.type === 'deposit'
                ? prevData.profitMetrics.overall.totalDeposits + amount
                : prevData.profitMetrics.overall.totalDeposits,
              totalWithdrawals: localTransactionData.type === 'withdrawal'
                ? prevData.profitMetrics.overall.totalWithdrawals + amount
                : prevData.profitMetrics.overall.totalWithdrawals,
              netProfit: localTransactionData.type === 'deposit'
                ? prevData.profitMetrics.overall.netProfit + amount
                : prevData.profitMetrics.overall.netProfit - amount
            }
          } : prevData.profitMetrics
        };
      });

      setLocalTransactionData({
        type: 'deposit',
        amount: '',
        status: 'success'
      });
      setManualTransactionOpen(false);

      toast.success(`Manual ${localTransactionData.type} created successfully`);
    } catch (error) {
      console.error('Failed to create manual transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create transaction';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setCreatingTransaction(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setManualTransactionOpen(open);
    if (!open) {
      setLocalTransactionData({
        type: 'deposit',
        amount: '',
        status: 'success'
      });
    }
  };

  return (
    <Dialog open={manualTransactionOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Manual Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-black">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create manual transaction</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="type" className="text-right">
                Type
              </Label>
              <Select 
                value={localTransactionData.type} 
                onValueChange={(value: 'deposit' | 'withdrawal') => 
                  setLocalTransactionData(prev => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={localTransactionData.amount}
                onChange={(e) => setLocalTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select 
                value={localTransactionData.status} 
                onValueChange={(value: 'success' | 'pending' | 'fail') => 
                  setLocalTransactionData(prev => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={creatingTransaction}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={creatingTransaction || !localTransactionData.amount}
            >
              {creatingTransaction ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Transaction'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Transactions</h1>
        </div>
        <div className="flex justify-center items-center min-h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-100"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Transactions</h1>
        </div>
        <div className="bg-black rounded-lg border p-8 text-center text-gray-500">
          <IndianRupee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">Error loading transactions.</p>
        </div>
      </div>
    );
  }

  const { user, balance, profitMetrics } = data;

  if (!data.transactions.all.length) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">
              {user?.name || "Unnamed User"} ({user?.email})
            </p>
          </div>
        </div>
        <div className="bg-black rounded-lg border p-8 text-center text-gray-500">
          <IndianRupee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">No transactions found for this user.</p>
          <div className="mt-4">
            <ManualTransactionDialog />
          </div>
        </div>
      </div>
    );
  }

  const currentTransactions = getCurrentTransactions();
  const totalPages = getTotalPages();
  const totalFilteredCount = getTotalFilteredCount();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Transactions</h1>
            <p className="text-sm text-gray-600 mt-1">
              {user?.name || "Unnamed User"} ({user?.email}) • {data.transactions.all.length} total transactions
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/users/${userId}/conversations`}>
              View Conversations
            </Link>
          </Button>
          <ManualTransactionDialog />
          <Button variant="outline" size="sm" onClick={downloadCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="text-sm mb-1">Available Balance</div>
          <div className="text-2xl font-bold text-green-600">
            {formatter.format(balance.available)}
          </div>
        </div>
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="text-sm mb-1">Pending Balance</div>
          <div className="text-2xl font-bold text-yellow-600">
            {formatter.format(balance.netPending)}
          </div>
        </div>
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="text-sm mb-1">Effective Balance</div>
          <div className="text-2xl font-bold text-blue-600">
            {formatter.format(balance.effective)}
          </div>
        </div>
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="text-sm mb-1">Total Transactions</div>
          <div className="text-2xl font-bold text-gray-400">
            {data.transactions.all.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="h-4 w-4 text-purple-400" />
            <div className="text-sm font-semibold text-purple-400">Transaction Profit</div>
          </div>
          <div className={`text-xl font-bold ${profitMetrics.transaction.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatter.format(profitMetrics.transaction.netProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profitMetrics.transaction.transactionCount} transactions
          </div>
        </div>
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <GamepadIcon className="h-4 w-4 text-orange-400" />
            <div className="text-sm font-semibold text-orange-400">Game Profit</div>
          </div>
          <div className={`text-xl font-bold ${profitMetrics.game.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatter.format(profitMetrics.game.netProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {profitMetrics.game.transactionCount} transactions
          </div>
        </div>
        <div className="p-4 rounded-lg border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-gray-300" />
            <div className="text-sm font-semibold text-gray-300">Overall Profit</div>
          </div>
          <div className={`text-xl font-bold ${profitMetrics.overall.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatter.format(profitMetrics.overall.netProfit)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            All {data.transactions.all.length} transactions
          </div>
        </div>
      </div>

      <div className="p-4 rounded-lg border shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
          <div>
            <label className="text-sm font-medium mb-2 block">Status</label>
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="fail">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Start Date</label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">End Date</label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Button variant="outline" onClick={resetFilters} className="w-full">
              Reset Filters
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); setCurrentPage(1); }} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transaction" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Transactions
            <Badge variant="secondary" className="ml-2">
              {data.transactions.transactionCategory.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="other" className="flex items-center gap-2">
            <GamepadIcon className="h-4 w-4" />
            Other
            <Badge variant="secondary" className="ml-2">
              {data.transactions.otherCategory.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="transaction" className="space-y-4">
          <div className="rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Create</TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No transactions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="">
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {format(new Date(transaction.createdAt), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(transaction.createdAt), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {format(new Date(transaction.updatedAt), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(transaction.updatedAt), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                          {getTypeText(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-semibold ${getAmountColor(transaction.type)}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatter.format(formatAmount(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <StatusDropdown transaction={transaction} />
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-gray-500">
                          {transaction.id}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalFilteredCount)} of{" "}
                {totalFilteredCount} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="other" className="space-y-4">
          <div className="rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Create</TableHead>
                  <TableHead>Update</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Transaction ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      No transactions found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="">
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {format(new Date(transaction.createdAt), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(transaction.createdAt), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-sm font-medium">
                          {format(new Date(transaction.updatedAt), "dd/MM/yyyy")}
                        </div>
                        <div className="text-xs">
                          {format(new Date(transaction.updatedAt), "HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'deposit' ? 'default' : 'secondary'}>
                          {getTypeText(transaction.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px]">
                          <p className="text-sm truncate">
                            {transaction.description || "No description"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {transaction.category || "Uncategorized"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`font-semibold ${getAmountColor(transaction.type)}`}>
                        {transaction.type === 'deposit' ? '+' : '-'}
                        {formatter.format(formatAmount(transaction.amount))}
                      </TableCell>
                      <TableCell>
                        <StatusDropdown transaction={transaction} />
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-mono text-gray-500">
                          {transaction.id}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <div className="text-sm text-gray-700">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalFilteredCount)} of{" "}
                {totalFilteredCount} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserTransactionsPage;