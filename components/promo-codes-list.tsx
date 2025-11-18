"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Copy, Edit, Eye, ToggleLeft, ToggleRight } from 'lucide-react';

interface PromoCodesListProps {
  promoCodes: any[];
}

export function PromoCodesList({ promoCodes }: PromoCodesListProps) {
  const [localPromoCodes, setLocalPromoCodes] = useState(promoCodes);

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      const response = await fetch(`/api/admin/promo-codes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' 
        })
      });

      if (response.ok) {
        setLocalPromoCodes(prev => prev.map(pc => 
          pc.id === id 
            ? { ...pc, status: currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' }
            : pc
        ));
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'EXPIRED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'DEPOSIT_BONUS': return 'bg-blue-100 text-blue-800';
      case 'FREE_SPINS': return 'bg-purple-100 text-purple-800';
      case 'CASHBACK': return 'bg-orange-100 text-orange-800';
      case 'FREE_BET': return 'bg-cyan-100 text-cyan-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Uses</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {localPromoCodes.map((promoCode) => (
            <TableRow key={promoCode.id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold">{promoCode.code}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(promoCode.code)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getTypeColor(promoCode.type)}>
                  {promoCode.type.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {promoCode.description}
              </TableCell>
              <TableCell>
                {promoCode._count.userPromoCodes} / {promoCode.maxUses || '∞'}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusColor(promoCode.status)}>
                  {promoCode.status}
                </Badge>
              </TableCell>
              <TableCell>
                {format(new Date(promoCode.createdAt), 'MMM dd, yyyy')}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleStatus(promoCode.id, promoCode.status)}
                  >
                    {promoCode.status === 'ACTIVE' ? (
                      <ToggleRight className="h-4 w-4 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-4 w-4 text-gray-600" />
                    )}
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {localPromoCodes.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <p>No promo codes created yet</p>
            <p className="text-sm">Create your first promo code using the form above</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}