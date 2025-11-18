import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [bonuses, totalCount] = await Promise.all([
      db.bonus.findMany({
        where: { userId: user.id },
        include: {
          promoCode: {
            select: { code: true, description: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.bonus.count({
        where: { userId: user.id }
      })
    ]);

    // Calculate active bonus balance
    const activeBonuses = await db.bonus.aggregate({
      where: { 
        userId: user.id,
        status: 'PENDING_WAGERING'
      },
      _sum: { 
        remainingAmount: true,
        freeSpinsWinnings: true
      }
    });

    const totalRemaining = (activeBonuses._sum.remainingAmount?.toNumber() || 0) + 
                          (activeBonuses._sum.freeSpinsWinnings?.toNumber() || 0);

    return NextResponse.json({ 
      bonuses,
      summary: {
        totalRemaining,
        activeCount: bonuses.filter(b => b.status === 'PENDING_WAGERING').length
      },
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.log('[BONUSES_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}