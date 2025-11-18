"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUp,
  ArrowDown,
  Copy,
  MoreVertical,
  History,
  Filter,
  Calendar
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatter } from "@/lib/utils";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

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
  user: User;
}

interface StatusHistory {
  id: string;
  status: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  transactionId: string;
}

interface TransactionDetails {
  transaction: Transaction;
  statusHistory: StatusHistory[];
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface Filters {
  search: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  userId: string;
}

const AdminTransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    status: '',
    type: '',
    dateFrom: '',
    dateTo: '',
    userId: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

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

      setTransactions(prevTransactions =>
        prevTransactions.map(transaction =>
          transaction.id === transactionId ? updatedTransaction : transaction
        )
      );

      if (selectedTransaction && selectedTransaction.transaction.id === transactionId) {
        setSelectedTransaction(prev => prev ? {
          ...prev,
          transaction: updatedTransaction
        } : null);
      }

      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update transaction status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update status';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setUpdating(null);
    }
  };

  const fetchTransactionDetails = async (transactionId: string) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(`/api/admin/transactions/${transactionId}/history`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transaction details: ${response.status}`);
      }
      
      const data = await response.json();
      setSelectedTransaction(data);
      setDetailsOpen(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      toast.error('Error loading transaction details');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleViewDetails = (transaction: Transaction) => {
    fetchTransactionDetails(transaction.id);
  };

  const fetchTransactions = async (page: number = 1, currentFilters: Filters = filters) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(currentFilters.search && { search: currentFilters.search }),
        ...(currentFilters.status && { status: currentFilters.status }),
        ...(currentFilters.type && { type: currentFilters.type }),
        ...(currentFilters.dateFrom && { dateFrom: currentFilters.dateFrom }),
        ...(currentFilters.dateTo && { dateTo: currentFilters.dateTo }),
        ...(currentFilters.userId && { userId: currentFilters.userId })
      });
      
      const response = await fetch(`/api/admin/transactions?${params}`);
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Unauthorized access');
          router.push('/login');
          return;
        }
        throw new Error(`Failed to fetch transactions: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error loading transactions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm }));
    fetchTransactions(1, { ...filters, search: searchTerm });
  };

  const clearSearch = () => {
    setSearchTerm('');
    setFilters(prev => ({ ...prev, search: '' }));
    fetchTransactions(1, { ...filters, search: '' });
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(1, newFilters);
  };

  const clearAllFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      type: '',
      dateFrom: '',
      dateTo: '',
      userId: ''
    };
    setFilters(emptyFilters);
    setSearchTerm('');
    fetchTransactions(1, emptyFilters);
  };

  const goToPage = (page: number) => {
    fetchTransactions(page, filters);
  };

  const exportFilteredTransactions = async () => {
    try {
      setExporting(true);
      toast.info('Exporting filtered transactions...');
      
      const exportParams = new URLSearchParams({
        limit: '100000',
        ...(filters.search && { search: filters.search }),
        ...(filters.status && { status: filters.status }),
        ...(filters.type && { type: filters.type }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo }),
        ...(filters.userId && { userId: filters.userId })
      });

      const response = await fetch(`/api/admin/transactions?${exportParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions for export: ${response.status}`);
      }

      const data = await response.json();
      const transactionsToExport = data.transactions;

      if (transactionsToExport.length === 0) {
        toast.error('No transactions found with current filters');
        return;
      }

      const headers = [
        'Transaction ID',
        'User Name',
        'User Email',
        'Type',
        'Amount',
        'Status',
        'Description',
        'Category',
        'Created Date',
        'Updated Date'
      ];

      const csvRows = transactionsToExport.map((transaction: Transaction) => [
        `"${transaction.id}"`,
        `"${transaction.user?.name || 'N/A'}"`,
        `"${transaction.user?.email || 'N/A'}"`,
        `"${getTypeText(transaction.type)}"`,
        `"${formatAmount(transaction.amount)}"`,
        `"${getStatusText(transaction.status)}"`,
        `"${transaction.description?.replace(/"/g, '""') || 'No description'}"`,
        `"${transaction.category || 'N/A'}"`,
        `"${format(new Date(transaction.createdAt), 'yyyy-MM-dd HH:mm:ss')}"`,
        `"${format(new Date(transaction.updatedAt), 'yyyy-MM-dd HH:mm:ss')}"`
      ]);

      const csvContent = [
        headers.join(','),
        ...csvRows.map((row: string[]) => row.join(','))
      ].join('\n');

      const filterInfo = [];
      if (filters.status) filterInfo.push(filters.status);
      if (filters.type) filterInfo.push(filters.type);
      if (filters.dateFrom) filterInfo.push(`from-${filters.dateFrom}`);
      if (filters.dateTo) filterInfo.push(`to-${filters.dateTo}`);
      if (filters.search) filterInfo.push('search');
      if (filters.userId) filterInfo.push('user-filter');
      
      const filename = `transactions${filterInfo.length > 0 ? `_${filterInfo.join('_')}` : ''}_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`;

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${transactionsToExport.length} filtered transactions to CSV`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      toast.error('Failed to export transactions');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

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

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDown className="h-4 w-4 text-green-600" />;
      case 'withdrawal':
        return <ArrowUp className="h-4 w-4 text-red-600" />;
      default:
        return null;
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


  const formatAmount = (amount: any): number => {
    if (typeof amount === 'number') {
      return amount;
    }
    if (amount && typeof amount.toNumber === 'function') {
      return amount.toNumber();
    }
    if (typeof amount === 'string') {
      const num = parseFloat(amount);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${type} copied to clipboard`);
    setTimeout(() => setCopied(false), 1500);
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  if (!mounted) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex justify-center items-center min-h-40">
          <div className="text-gray-600 text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {hasActiveFilters && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                !
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFilteredTransactions}
            disabled={exporting || transactions.length === 0}
          >
            {exporting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-6 p-4 border rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold">Filters</h3>
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select 
                value={filters.status || "all"} 
                onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="fail">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select 
                value={filters.type || "all"} 
                onValueChange={(value) => handleFilterChange('type', value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="deposit">Deposit</SelectItem>
                  <SelectItem value="withdrawal">Withdrawal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 max-w-md">
            <label className="text-sm font-medium mb-2 block">User ID</label>
            <Input
              placeholder="Filter by User ID"
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="py-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="search"
                type="text"
                placeholder="Search by user name, email, description, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button type="submit">
            Search
          </Button>
          <Button type="button" variant="outline" onClick={clearSearch}>
            Clear
          </Button>
        </form>
      </div>
      
      <div className="rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">Transaction</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No transactions found.
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="flex flex-col pl-3">
                      <div className="font-medium text-lg">
                        <span
                          className="font-medium text-lg cursor-pointer"
                          onClick={() => handleCopy(transaction.id, "Transaction ID")}
                          title="Click to copy transaction ID"
                        >
                          {transaction.id}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div
                        className="font-medium cursor-pointer"
                        onClick={() => handleCopy(transaction.userId, "User ID")}
                        title="Click to copy user ID"
                      >
                        {transaction.user?.name || "Unknown User"}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(transaction.type)}
                      <span className="font-medium">{getTypeText(transaction.type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-bold`}>
                      {formatter.format(formatAmount(transaction.amount))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transaction.status)}
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(transaction.createdAt), "MMM dd, yyyy")}
                    </div>
                    <div className="text-xs text-gray-400">
                      {format(new Date(transaction.createdAt), "HH:mm")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleViewDetails(transaction)}
                      variant="outline"
                      size="sm"
                      disabled={loadingDetails}
                    >
                      <History className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && transactions.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * 10 + 1} to{" "}
              {Math.min(pagination.currentPage * 10, pagination.totalCount)} of{" "}
              {pagination.totalCount} transactions
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.currentPage >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.currentPage - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto bg-black">
          <DialogHeader>
            <DialogTitle>Transaction Details</DialogTitle>
          </DialogHeader>

          {selectedTransaction && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">Transaction Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ID:</span>
                      <span className="font-mono text-xs">{selectedTransaction.transaction.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className={`font-bold`}>
                        ${formatAmount(selectedTransaction.transaction.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="flex items-center gap-1">
                        {getTypeIcon(selectedTransaction.transaction.type)}
                        {getTypeText(selectedTransaction.transaction.type)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <Badge variant={getStatusVariant(selectedTransaction.transaction.status)}>
                        {getStatusText(selectedTransaction.transaction.status)}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Name:</span>
                      <span>{selectedTransaction.transaction.user?.name || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span>{selectedTransaction.transaction.user?.email || "No email"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">User ID:</span>
                      <span className="font-mono text-xs">{selectedTransaction.transaction.userId}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-4">Status History</h4>
                <div className="space-y-3">
                  {selectedTransaction.statusHistory.map((history, index) => (
                    <div key={history.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                        history.status === 'success' ? 'bg-green-500' :
                        history.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getStatusVariant(history.status)}>
                            {getStatusText(history.status)}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {format(new Date(history.createdAt), "MMM dd, yyyy 'at' HH:mm")}
                          </span>
                        </div>
                        {history.note && (
                          <p className="text-sm text-gray-600">{history.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold mb-2">Dates</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Created:</span>
                      <span>{format(new Date(selectedTransaction.transaction.createdAt), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Last Updated:</span>
                      <span>{format(new Date(selectedTransaction.transaction.updatedAt), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionsPage;