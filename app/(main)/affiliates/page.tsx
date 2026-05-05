"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft, ChevronRight, Search, X, UserPlus, TrendingDown,
  Users, IndianRupee, Eye, TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatter } from "@/lib/utils";

interface Affiliate {
  id: string;
  name: string | null;
  email: string | null;
  createdAt: string;
  commissionPercent: number | null;
  totalMediaBuyers: number;
  totalReferrals: number;
  totalNgr: string;
  totalBalance: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminAffiliatesPage = () => {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);
  const [creating, setCreating] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const [newAffiliateForm, setNewAffiliateForm] = useState({
    name: "",
    email: "",
    password: "",
    commissionPercent: "",
  });
  const [withdrawForm, setWithdrawForm] = useState({ amount: "", description: "" });

  const router = useRouter();

  const fetchAffiliates = async (page = 1, search = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });
      const res = await fetch(`/api/admin/affiliates?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setAffiliates(data.users);
      setPagination(data.pagination);
    } catch (error) {
      toast.error("Failed to load affiliates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAffiliates(1, searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm("");
    fetchAffiliates(1);
  };

  const goToPage = (page: number) => {
    fetchAffiliates(page, searchTerm);
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await fetch("/api/admin/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAffiliateForm),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Affiliate created");
      setCreateModalOpen(false);
      setNewAffiliateForm({ name: "", email: "", password: "", commissionPercent: "" });
      fetchAffiliates(pagination.currentPage, searchTerm);
    } catch (error) {
      toast.error("Failed to create affiliate");
    } finally {
      setCreating(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAffiliate) return;
    setWithdrawing(true);
    try {
      const res = await fetch(`/api/admin/affiliates/${selectedAffiliate.id}/withdraw`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(withdrawForm.amount),
          description: withdrawForm.description,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Withdrawal created");
      setWithdrawModalOpen(false);
      setSelectedAffiliate(null);
      setWithdrawForm({ amount: "", description: "" });
      fetchAffiliates(pagination.currentPage, searchTerm);
    } catch (error) {
      toast.error("Failed to withdraw");
    } finally {
      setWithdrawing(false);
    }
  };

  const formatAmount = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return formatter.format(num);
  };

  const totalStats = affiliates.reduce(
    (acc, aff) => {
      acc.totalMediaBuyers += aff.totalMediaBuyers;
      acc.totalReferrals += aff.totalReferrals;
      return acc;
    },
    { totalMediaBuyers: 0, totalReferrals: 0 }
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto mt-2">
      <h1 className="text-2xl font-bold mb-4">Manage Affiliates</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Affiliates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalCount}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Media Buyers Managed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalMediaBuyers}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStats.totalReferrals}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total NGR (all affiliates)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(
                affiliates.reduce((sum, aff) => sum + parseFloat(aff.totalNgr), 0).toString()
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 w-full sm:max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search affiliates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchTerm && (
              <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={clearSearch}>Clear</Button>
        </form>
        <Button onClick={() => setCreateModalOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Affiliate
        </Button>
      </div>

      {/* Affiliates Table */}
      <div className="rounded-lg shadow-sm border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Affiliate</TableHead>
              <TableHead className="whitespace-nowrap">Media Buyers</TableHead>
              <TableHead className="whitespace-nowrap">Referrals</TableHead>
              <TableHead className="whitespace-nowrap">NGR</TableHead>
              <TableHead className="whitespace-nowrap">Balance</TableHead>
              <TableHead className="whitespace-nowrap">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
              </TableRow>
            ) : affiliates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">No affiliates found.</TableCell>
              </TableRow>
            ) : (
              affiliates.map((aff) => (
                <TableRow
                  key={aff.id}
                  className="cursor-pointer hover:bg-gray-900 transition-colors"
                  onClick={() => router.push(`/admin/affiliates/${aff.id}`)}
                >
                  <TableCell>
                    <div className="font-medium">{aff.name || "Unnamed"}</div>
                    <div className="text-sm text-gray-400">{aff.email}</div>
                  </TableCell>
                  <TableCell>{aff.totalMediaBuyers}</TableCell>
                  <TableCell>{aff.totalReferrals}</TableCell>
                  <TableCell>{formatAmount(aff.totalNgr)}</TableCell>
                  <TableCell>{formatAmount(aff.totalBalance)}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAffiliate(aff);
                        setWithdrawModalOpen(true);
                      }}
                    >
                      <TrendingDown className="h-4 w-4 mr-1" />
                      Withdraw
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {!loading && affiliates.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-400">
              Showing {(pagination.currentPage - 1) * 10 + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} affiliates
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(pagination.currentPage - 1)} disabled={!pagination.hasPrev}>
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) pageNum = i + 1;
                  else if (pagination.currentPage <= 3) pageNum = i + 1;
                  else if (pagination.currentPage >= pagination.totalPages - 2) pageNum = pagination.totalPages - 4 + i;
                  else pageNum = pagination.currentPage - 2 + i;
                  return (
                    <Button key={pageNum} variant={pagination.currentPage === pageNum ? "default" : "outline"} size="sm" onClick={() => goToPage(pageNum)}>
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <span className="sm:hidden text-sm">Page {pagination.currentPage} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => goToPage(pagination.currentPage + 1)} disabled={!pagination.hasNext}>
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Affiliate Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="bg-black border-gray-800 w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Affiliate Account</DialogTitle>
            <DialogDescription>Add a new affiliate.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAffiliate}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={newAffiliateForm.name} onChange={(e) => setNewAffiliateForm({ ...newAffiliateForm, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={newAffiliateForm.email} onChange={(e) => setNewAffiliateForm({ ...newAffiliateForm, email: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={newAffiliateForm.password} onChange={(e) => setNewAffiliateForm({ ...newAffiliateForm, password: e.target.value })} required minLength={8} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commissionPercent">Commission Percentage (%)</Label>
                <Input id="commissionPercent" type="number" step="0.1" min="0" max="100" value={newAffiliateForm.commissionPercent} onChange={(e) => setNewAffiliateForm({ ...newAffiliateForm, commissionPercent: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={creating}>{creating ? "Creating..." : "Create Affiliate"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="bg-black border-gray-800 w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Withdraw for {selectedAffiliate?.name || selectedAffiliate?.email}</DialogTitle>
            <DialogDescription>Create a withdrawal transaction.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleWithdraw}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="withdrawAmount">Amount (₹)</Label>
                <Input id="withdrawAmount" type="number" step="0.01" min="0" value={withdrawForm.amount} onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="withdrawDescription">Description (optional)</Label>
                <Input id="withdrawDescription" value={withdrawForm.description} onChange={(e) => setWithdrawForm({ ...withdrawForm, description: e.target.value })} />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setWithdrawModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={withdrawing}>{withdrawing ? "Processing..." : "Confirm Withdrawal"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAffiliatesPage;