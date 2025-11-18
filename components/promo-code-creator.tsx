"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AlertCircle, CalendarIcon, CheckCircle, Users, UserSearch, Percent, Search } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
}

const promoCodeTypes = [
  { value: 'DEPOSIT_BONUS', label: 'Deposit Bonus' },
  { value: 'FREE_SPINS', label: 'Free Spins' },
  { value: 'CASHBACK', label: 'Cashback' },
  { value: 'FREE_BET', label: 'Free Bet' },
  { value: 'COMBINED', label: 'Combined Bonus' }
];

export function PromoCodeCreator() {
  const [formData, setFormData] = useState({
    code: '',
    type: 'DEPOSIT_BONUS',
    description: '',
    bonusPercentage: 100,
    maxBonusAmount: '',
    minDepositAmount: '',
    freeSpinsCount: '',
    freeSpinsGame: '',
    cashbackPercentage: '',
    wageringRequirement: 35,
    maxUses: '',
    usesPerUser: 1,
    isOneTimeUse: true,
    startDate: new Date(),
    endDate: null as Date | null,
    assignedUserId: 'none',
    commissionPercentage: 1.0,
  });
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user =>
        user.id.toLowerCase().includes(query) ||
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async (search = '') => {
    try {
      setIsSearching(true);
      const url = search ? `/api/admin/users?search=${encodeURIComponent(search)}&limit=100` : '/api/admin/users?limit=100';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setFilteredUsers(data.users || []);
      } else {
        console.error('Failed to fetch users:', response.status);
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      fetchUsers(query);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);

    try {
      const payload = {
        ...formData,
        maxBonusAmount: formData.maxBonusAmount ? parseFloat(formData.maxBonusAmount) : null,
        minDepositAmount: formData.minDepositAmount ? parseFloat(formData.minDepositAmount) : null,
        freeSpinsCount: formData.freeSpinsCount ? parseInt(formData.freeSpinsCount) : null,
        cashbackPercentage: formData.cashbackPercentage ? parseInt(formData.cashbackPercentage) : null,
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
        assignedUserId: formData.assignedUserId !== 'none' ? formData.assignedUserId : null,
        commissionPercentage: formData.assignedUserId !== 'none' ? parseFloat(formData.commissionPercentage.toString()) : null,
      };

      const response = await fetch('/api/admin/promo-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Promo code created successfully!' });
        setFormData({
          code: '',
          type: 'DEPOSIT_BONUS',
          description: '',
          bonusPercentage: 100,
          maxBonusAmount: '',
          minDepositAmount: '',
          freeSpinsCount: '',
          freeSpinsGame: '',
          cashbackPercentage: '',
          wageringRequirement: 35,
          maxUses: '',
          usesPerUser: 1,
          isOneTimeUse: true,
          startDate: new Date(),
          endDate: null,
          assignedUserId: 'none',
          commissionPercentage: 1.0,
        });
        setSearchQuery('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create promo code' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to create promo code' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderBonusFields = () => {
    const showDepositFields = formData.type === 'DEPOSIT_BONUS' || formData.type === 'COMBINED';
    const showFreeSpinsFields = formData.type === 'FREE_SPINS' || formData.type === 'COMBINED';
    const showCashbackFields = formData.type === 'CASHBACK';

    return (
      <div className="space-y-4">
        {showDepositFields && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="sm:col-span-3">
              <Label className="text-blue-400 flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Deposit Bonus Settings
              </Label>
            </div>
            <div>
              <Label htmlFor="bonusPercentage">Bonus Percentage</Label>
              <Input
                id="bonusPercentage"
                type="number"
                value={formData.bonusPercentage}
                onChange={(e) => setFormData({ ...formData, bonusPercentage: parseInt(e.target.value) })}
                placeholder="100"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="maxBonusAmount">Max Bonus Amount</Label>
              <Input
                id="maxBonusAmount"
                type="number"
                step="0.01"
                value={formData.maxBonusAmount}
                onChange={(e) => setFormData({ ...formData, maxBonusAmount: e.target.value })}
                placeholder="100.00"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="minDepositAmount">Min Deposit Amount</Label>
              <Input
                id="minDepositAmount"
                type="number"
                step="0.01"
                value={formData.minDepositAmount}
                onChange={(e) => setFormData({ ...formData, minDepositAmount: e.target.value })}
                placeholder="10.00"
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        )}

        {showFreeSpinsFields && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <div className="sm:col-span-2">
              <Label className="text-purple-400 flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Free Spins Settings
              </Label>
            </div>
            <div>
              <Label htmlFor="freeSpinsCount">Free Spins Count</Label>
              <Input
                id="freeSpinsCount"
                type="number"
                value={formData.freeSpinsCount}
                onChange={(e) => setFormData({ ...formData, freeSpinsCount: e.target.value })}
                placeholder="20"
                className="bg-gray-700 border-gray-600"
              />
            </div>
            <div>
              <Label htmlFor="freeSpinsGame">Free Spins Game</Label>
              <Input
                id="freeSpinsGame"
                value={formData.freeSpinsGame}
                onChange={(e) => setFormData({ ...formData, freeSpinsGame: e.target.value })}
                placeholder="Book of Dead"
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        )}

        {showCashbackFields && (
          <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20">
            <Label className="text-green-400 flex items-center gap-2 mb-3">
              <Users className="h-4 w-4" />
              Cashback Settings
            </Label>
            <div>
              <Label htmlFor="cashbackPercentage">Cashback Percentage</Label>
              <Input
                id="cashbackPercentage"
                type="number"
                value={formData.cashbackPercentage}
                onChange={(e) => setFormData({ ...formData, cashbackPercentage: e.target.value })}
                placeholder="10"
                className="bg-gray-700 border-gray-600"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData({ ...formData, startDate: date });
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setFormData({ ...formData, endDate: date || null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Card className={message.type === 'success' ? 'border-green-500/20 bg-green-500/10' : 'border-red-500/20 bg-red-500/10'}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400" />
              )}
              <span className={message.type === 'success' ? 'text-green-400' : 'text-red-400'}>
                {message.text}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="code" className="text-white">Promo Code</Label>
          <Input
            id="code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
            placeholder="WELCOME100"
            required
            className="uppercase bg-gray-700 border-gray-600 text-white placeholder-gray-400"
          />
        </div>
        
        <div>
          <Label htmlFor="type" className="text-white">Bonus Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
            <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              {promoCodeTypes.map(type => (
                <SelectItem key={type.value} value={type.value} className="text-white">
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description" className="text-white">Description</Label>
        <Input
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Welcome bonus for new players"
          required
          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
        />
      </div>

      {renderBonusFields()}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="wageringRequirement" className="text-white">Wagering Requirement (x)</Label>
          <Input
            id="wageringRequirement"
            type="number"
            value={formData.wageringRequirement}
            onChange={(e) => setFormData({ ...formData, wageringRequirement: parseInt(e.target.value) })}
            placeholder="35"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="maxUses" className="text-white">Max Uses (optional)</Label>
          <Input
            id="maxUses"
            type="number"
            value={formData.maxUses}
            onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
            placeholder="Unlimited"
            className="bg-gray-700 border-gray-600 text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label className="text-white">Start Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                  !formData.startDate && "text-gray-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.startDate ? format(formData.startDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <Calendar
                mode="single"
                selected={formData.startDate}
                onSelect={handleStartDateSelect}
                initialFocus
                className="bg-gray-800"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label className="text-white">End Date (optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal bg-gray-700 border-gray-600 text-white hover:bg-gray-600",
                  !formData.endDate && "text-gray-400"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.endDate ? format(formData.endDate, "PPP") : <span>No end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700">
              <Calendar
                mode="single"
                selected={formData.endDate || undefined}
                onSelect={handleEndDateSelect}
                initialFocus
                className="bg-gray-800"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
        <Label className="text-yellow-400 flex items-center gap-2 mb-3">
          <UserSearch className="h-4 w-4" />
          Influencer Assignment (Optional)
        </Label>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="userSearch" className="text-white flex items-center gap-2 mb-2">
              <Search className="h-4 w-4" />
              Search Users
            </Label>
            <Input
              id="userSearch"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search by ID, name, or email..."
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              Search users by their ID, name, or email address
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="assignedUserId" className="text-white">Assign to User</Label>
              <Select 
                value={formData.assignedUserId} 
                onValueChange={(value) => setFormData({ ...formData, assignedUserId: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select an influencer (optional)" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 max-h-60">
                  <SelectItem value="none" className="text-gray-400">
                    No influencer assigned
                  </SelectItem>
                  {isSearching ? (
                    <SelectItem value="loading" disabled className="text-gray-400">
                      Searching users...
                    </SelectItem>
                  ) : filteredUsers.length === 0 ? (
                    <SelectItem value="no-results" disabled className="text-gray-400">
                      No users found
                    </SelectItem>
                  ) : (
                    filteredUsers.map(user => (
                      <SelectItem 
                        key={user.id} 
                        value={user.id} 
                        className="text-white"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-gray-400">{user.email}</span>
                          <span className="text-xs text-gray-500">ID: {user.id}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="commissionPercentage" className="text-white flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Commission Percentage
              </Label>
              <Input
                id="commissionPercentage"
                type="number"
                step="0.1"
                min="0.1"
                max="50"
                value={formData.commissionPercentage}
                onChange={(e) => setFormData({ ...formData, commissionPercentage: parseFloat(e.target.value) || 1.0 })}
                placeholder="1.0"
                className="bg-gray-700 border-gray-600 text-white"
                disabled={formData.assignedUserId === 'none'}
              />
            </div>
          </div>
        </div>
        
        <p className="text-xs text-yellow-300 mt-2">
          {formData.assignedUserId !== 'none' ? (
            <>
              This user will receive <span className="font-bold">{formData.commissionPercentage}%</span> commission from all withdrawals (excluding transaction category) made by users who use this promo code.
            </>
          ) : (
            "Select an influencer to enable commission payments."
          )}
        </p>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isOneTimeUse"
          checked={formData.isOneTimeUse}
          onCheckedChange={(checked) => setFormData({ ...formData, isOneTimeUse: checked })}
        />
        <Label htmlFor="isOneTimeUse" className="text-white">One-time use per account</Label>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0"
        disabled={isLoading}
      >
        {isLoading ? 'Creating...' : 'Create Promo Code'}
      </Button>
    </form>
  );
}