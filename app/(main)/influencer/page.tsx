import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/lib/db';
import { auth } from '@/auth';
import { DollarSign, Users, TrendingUp } from 'lucide-react';

async function getInfluencerEarnings() {
  return await db.influencerEarning.findMany({
    include: {
      influencer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      sourceUser: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      },
      promoCode: {
        select: {
          code: true,
          commissionPercentage: true,
        }
      },
      withdrawal: {
        select: {
          amount: true,
          description: true,
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 50
  });
}

async function getEarningsStats() {
  const totalEarnings = await db.influencerEarning.aggregate({
    _sum: {
      amount: true
    }
  });

  const totalInfluencers = await db.influencerEarning.groupBy({
    by: ['influencerId'],
    _count: {
      id: true
    }
  });

  const recentEarnings = await db.influencerEarning.aggregate({
    _sum: {
      amount: true
    },
    where: {
      createdAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  return {
    totalEarnings: totalEarnings._sum.amount?.toNumber() || 0,
    totalInfluencers: totalInfluencers.length,
    recentEarnings: recentEarnings._sum.amount?.toNumber() || 0
  };
}

export default async function InfluencerEarningsPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'ADMIN') {
    return <div>Unauthorized</div>;
  }

  const [earnings, stats] = await Promise.all([
    getInfluencerEarnings(),
    getEarningsStats()
  ]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Influencer Earnings</h1>
          <p className="text-gray-400">Track commission payments to influencers</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-blue-400">All time commission payments</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/10 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Active Influencers</CardTitle>
            <Users className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalInfluencers}</div>
            <p className="text-xs text-green-400">Influencers with earnings</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Last 7 Days</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.recentEarnings.toFixed(2)}</div>
            <p className="text-xs text-purple-400">Recent commission payments</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Commission History</CardTitle>
          <CardDescription className="text-gray-400">
            Recent commission payments to influencers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-600" />
              <p>No commission payments yet</p>
              <p className="text-sm">Commissions will appear here when users make withdrawals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {earnings.map((earning) => (
                <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-green-500/20 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {earning.influencer.name} ({earning.influencer.email})
                      </p>
                      <p className="text-sm text-gray-400">
                        From: {earning.sourceUser.name || earning.sourceUser.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Promo Code: {earning.promoCode?.code || 'Unknown'} 
                        {earning.promoCode?.commissionPercentage && (
                          ` (${earning.promoCode.commissionPercentage}%)`
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">+${earning.amount.toNumber().toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(earning.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}