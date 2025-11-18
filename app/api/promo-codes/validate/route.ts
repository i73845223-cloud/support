import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { code, depositAmount } = await req.json();

    if (!code) {
      return new NextResponse("Promo code is required", { status: 400 });
    }

    const promoCode = await db.promoCode.findFirst({
      where: {
        code: code.toUpperCase(),
        status: 'ACTIVE',
        startDate: { lte: new Date() },
        OR: [
          { endDate: null },
          { endDate: { gte: new Date() } }
        ]
      },
      include: {
        userPromoCodes: {
          where: { userId: user.id }
        }
      }
    });

    if (!promoCode) {
      return new NextResponse("Invalid or expired promo code", { status: 404 });
    }

    // Check max uses
    if (promoCode.maxUses && promoCode.currentUses >= promoCode.maxUses) {
      return new NextResponse("Promo code has reached maximum uses", { status: 400 });
    }

    // Check per user uses
    const userPromoCode = promoCode.userPromoCodes[0];
    if (promoCode.usesPerUser && userPromoCode && userPromoCode.timesUsed >= promoCode.usesPerUser) {
      return new NextResponse("You have already used this promo code", { status: 400 });
    }

    // Check minimum deposit for deposit bonuses
    if (depositAmount && promoCode.minDepositAmount && depositAmount < promoCode.minDepositAmount) {
      return new NextResponse(`Minimum deposit of ${promoCode.minDepositAmount} required`, { status: 400 });
    }

    // Calculate bonus details
    let bonusDetails = {};
    
    switch (promoCode.type) {
      case 'DEPOSIT_BONUS':
        if (!depositAmount) {
          return new NextResponse("Deposit amount required for deposit bonus", { status: 400 });
        }
        
        const bonusAmount = Math.min(
          depositAmount * (promoCode.bonusPercentage! / 100),
          promoCode.maxBonusAmount?.toNumber() || Infinity
        );
        
        bonusDetails = {
          bonusAmount,
          wageringRequirement: bonusAmount * (promoCode.wageringRequirement || 1)
        };
        break;
        
      case 'FREE_SPINS':
        bonusDetails = {
          freeSpins: promoCode.freeSpinsCount,
          game: promoCode.freeSpinsGame
        };
        break;
        
      case 'CASHBACK':
        bonusDetails = {
          cashbackPercentage: promoCode.cashbackPercentage
        };
        break;
    }

    return NextResponse.json({
      valid: true,
      promoCode: {
        id: promoCode.id,
        code: promoCode.code,
        type: promoCode.type,
        description: promoCode.description,
        ...bonusDetails
      }
    });

  } catch (error) {
    console.log('[PROMO_CODE_VALIDATE]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}