import { PromoCodeCreator } from '@/components/promo-code-creator';
import { PromoCodesList } from '@/components/promo-codes-list';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';

async function getPromoCodes() {
  return await db.promoCode.findMany({
    include: {
      userPromoCodes: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      },
      _count: {
        select: {
          userPromoCodes: true,
          bonuses: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export default async function AdminPromoCodesPage() {
  const promoCodes = await getPromoCodes();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Promo Codes Management</h1>
          <p className="text-gray-600">Create and manage promotional codes</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Create Promo Code */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Promo Code</CardTitle>
            <CardDescription>
              Create a new promotional code for users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromoCodeCreator />
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Promo Codes Overview</CardTitle>
            <CardDescription>
              Summary of all promotional codes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {promoCodes.length}
                </div>
                <div className="text-sm text-blue-600">Total Codes</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {promoCodes.filter(p => p.status === 'ACTIVE').length}
                </div>
                <div className="text-sm text-green-600">Active Codes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promo Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>All Promo Codes</CardTitle>
          <CardDescription>
            Manage existing promotional codes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PromoCodesList promoCodes={promoCodes} />
        </CardContent>
      </Card>
    </div>
  );
}