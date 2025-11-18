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
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  Ban,
  MessageSquare,
  CheckCircle,
  CreditCard,
  Eye,
  FileCheck,
  FileX
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isBlocked: boolean;
  isChatBlocked: boolean;
  isImageApproved: string;
  createdAt: string;
  image?: {
    id: string;
    url: string;
    createdAt: string;
  } | null;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
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
  const [passportModalOpen, setPassportModalOpen] = useState(false);
  const [selectedUserForPassport, setSelectedUserForPassport] = useState<User | null>(null);
  const [approvingPassport, setApprovingPassport] = useState(false);
  const router = useRouter();

  const getAdminImageUrl = (imageUrl: string) => {
    if (!imageUrl) return '';
    return `/api/proxy-image?filename=${encodeURIComponent(imageUrl)}`;
  };

  const getPassportStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPassportStatusText = (status: string) => {
    switch (status) {
      case 'success': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'pending': return 'Pending Review';
      case 'none': return 'Not Uploaded';
      default: return status || 'Not Uploaded';
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateUserStatus = async (userId: string, statusType: "isBlocked" | "isChatBlocked", value: boolean) => {
    try {
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, statusType, value }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP Error: ${response.status}`);
      return data;
    } catch (error) {
      console.error('Failed to update user status:', error);
      throw error;
    }
  };

  const approveUserPassport = async (userId: string, status: 'success' | 'rejected') => {
    try {
      setApprovingPassport(true);
      const response = await fetch('/api/admin/approve-passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, status }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || `HTTP Error: ${response.status}`);
      toast.success(`Passport ${status === 'success' ? 'approved' : 'rejected'} successfully`);
      setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, isImageApproved: status } : user));
      setPassportModalOpen(false);
      setSelectedUserForPassport(null);
      return data;
    } catch (error) {
      console.error('Failed to update passport status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update passport status';
      toast.error(errorMessage);
      throw error;
    } finally {
      setApprovingPassport(false);
    }
  };

  const handleToggleBlock = async (userId: string, currentStatus: boolean) => {
    const updateId = `block-${userId}`;
    setUpdating(updateId);
    const newValue = !currentStatus;
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, isBlocked: newValue } : user
      )
    );
    
    try {
      await updateUserStatus(userId, "isBlocked", newValue);
    } catch (error) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isBlocked: currentStatus } : user
        )
      );
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user status';
      alert(`Error: ${errorMessage}`);
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        router.push('/login');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleToggleChatBlock = async (userId: string, currentStatus: boolean) => {
    const updateId = `chat-${userId}`;
    setUpdating(updateId);
    const newValue = !currentStatus;
    
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, isChatBlocked: newValue } : user
      )
    );
    
    try {
      await updateUserStatus(userId, "isChatBlocked", newValue);
    } catch (error) {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isChatBlocked: currentStatus } : user
        )
      );
      const errorMessage = error instanceof Error ? error.message : 'Failed to update chat status';
      alert(`Error: ${errorMessage}`);
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
        router.push('/login');
      }
    } finally {
      setUpdating(null);
    }
  };

  const fetchUsers = async (page: number = 1, search: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString(), limit: '10', ...(search && { search }) });
      const response = await fetch(`/api/admin/users?${params}`);
      if (!response.ok) throw new Error(`Failed to fetch users: ${response.status}`);
      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching users:', error);
      alert('Error loading users.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, searchTerm);
  };

  const clearSearch = () => {
    setSearchTerm('');
    fetchUsers(1);
  };

  const goToPage = (page: number) => {
    fetchUsers(page, searchTerm);
  };

  const openPassportModal = (user: User) => {
    setSelectedUserForPassport(user);
    setPassportModalOpen(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
      <div className="py-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, email, ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button type="button" onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <Button type="submit">Search</Button>
          <Button type="button" variant="outline" onClick={clearSearch}>Clear</Button>
        </form>
      </div>
      
      <div className="rounded-lg shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-5">User</TableHead>
              <TableHead>Passport Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chat Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col pl-3">
                      <div className="font-medium text-lg">{user.name || "Unnamed User"}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPassportStatusColor(user.isImageApproved)}`}>
                        {getPassportStatusText(user.isImageApproved)}
                      </span>
                      {user.image && user.image.url && (
                        <Button variant="outline" size="sm" onClick={() => openPassportModal(user)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleToggleBlock(user.id, user.isBlocked)}
                      disabled={updating === `block-${user.id}`}
                      variant={user.isBlocked ? "default" : "destructive"}
                      size="sm"
                      className={user.isBlocked ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {updating === `block-${user.id}` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : user.isBlocked ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-1" />
                          Block
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Button
                      onClick={() => handleToggleChatBlock(user.id, user.isChatBlocked)}
                      disabled={updating === `chat-${user.id}`}
                      variant={user.isChatBlocked ? "default" : "outline"}
                      size="sm"
                      className={user.isChatBlocked ? "bg-green-600 hover:bg-green-700 text-white" : "border-yellow-500 text-yellow-600 hover:bg-yellow-800"}
                    >
                      {updating === `chat-${user.id}` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                      ) : user.isChatBlocked ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unblock Chat
                        </>
                      ) : (
                        <>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Block Chat
                        </>
                      )}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/users/${user.id}/transactions`}>
                          <CreditCard className="h-4 w-4 mr-1" />
                          Transactions
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/users/${user.id}/conversations`}>
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Chats
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-700">
              Showing {(pagination.currentPage - 1) * 10 + 1} to {Math.min(pagination.currentPage * 10, pagination.totalCount)} of {pagination.totalCount} users
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(pagination.currentPage - 1)} disabled={!pagination.hasPrev}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex gap-1">
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
              <Button variant="outline" size="sm" onClick={() => goToPage(pagination.currentPage + 1)} disabled={!pagination.hasNext}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={passportModalOpen} onOpenChange={setPassportModalOpen}>
        <DialogContent className="max-w-4xl bg-black">
          <DialogHeader>
            <DialogTitle>Passport Verification</DialogTitle>
            <DialogDescription>Review and verify the passport/document for {selectedUserForPassport?.name || selectedUserForPassport?.email}</DialogDescription>
          </DialogHeader>
          {selectedUserForPassport && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2">User Information</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Name:</strong> {selectedUserForPassport.name || 'Not provided'}</p>
                    <p><strong>Email:</strong> {selectedUserForPassport.email}</p>
                    <p><strong>User ID:</strong> {selectedUserForPassport.id}</p>
                    <p><strong>Current Status:</strong> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${getPassportStatusColor(selectedUserForPassport.isImageApproved)}`}>
                        {getPassportStatusText(selectedUserForPassport.isImageApproved)}
                      </span>
                    </p>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Verification Actions</h4>
                  <div className="space-y-2">
                    <Button onClick={() => approveUserPassport(selectedUserForPassport.id, 'success')} disabled={approvingPassport || selectedUserForPassport.isImageApproved === 'success'} className="w-full bg-green-600 hover:bg-green-700">
                      <FileCheck className="h-4 w-4 mr-2" />
                      Approve Passport
                    </Button>
                    <Button onClick={() => approveUserPassport(selectedUserForPassport.id, 'rejected')} disabled={approvingPassport || selectedUserForPassport.isImageApproved === 'rejected'} variant="destructive" className="w-full">
                      <FileX className="h-4 w-4 mr-2" />
                      Reject Passport
                    </Button>
                  </div>
                </div>
              </div>
              {selectedUserForPassport.image && selectedUserForPassport.image.url ? (
                <div>
                  <h4 className="font-semibold mb-3">Uploaded Document</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <img 
                      src={getAdminImageUrl(selectedUserForPassport.image.url)} 
                      alt="Passport document"
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">Uploaded on: {new Date(selectedUserForPassport.image.createdAt).toLocaleDateString()}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileX className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>No document uploaded by user</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsersPage;