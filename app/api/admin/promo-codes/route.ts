import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

// Helper function to convert Decimal to number
const convertDecimalToNumber = (value: any): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (value && typeof value === 'object' && 'toNumber' in value) {
    return value.toNumber();
  }
  return parseFloat(value) || null;
};

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const promoCodes = await db.promoCode.findMany({
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
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

    // Convert Decimal fields to numbers for client-side
    const serializedPromoCodes = promoCodes.map(promoCode => ({
      ...promoCode,
      maxBonusAmount: convertDecimalToNumber(promoCode.maxBonusAmount),
      minDepositAmount: convertDecimalToNumber(promoCode.minDepositAmount),
      commissionPercentage: convertDecimalToNumber(promoCode.commissionPercentage),
    }));

    return NextResponse.json(serializedPromoCodes);
  } catch (error) {
    console.log('[ADMIN_PROMO_CODES_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id || user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    
    const {
      code,
      type,
      description,
      bonusPercentage,
      maxBonusAmount,
      minDepositAmount,
      freeSpinsCount,
      freeSpinsGame,
      cashbackPercentage,
      wageringRequirement,
      maxUses,
      usesPerUser,
      isOneTimeUse,
      startDate,
      endDate,
      assignedUserId,
      commissionPercentage,
    } = body;

    // Check if code already exists
    const existingCode = await db.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (existingCode) {
      return new NextResponse("Promo code already exists", { status: 400 });
    }

    const promoCode = await db.promoCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        description,
        bonusPercentage,
        maxBonusAmount,
        minDepositAmount,
        freeSpinsCount,
        freeSpinsGame,
        cashbackPercentage,
        wageringRequirement,
        maxUses,
        usesPerUser,
        isOneTimeUse,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: 'ACTIVE',
        assignedUserId: assignedUserId || null,
        commissionPercentage: commissionPercentage || null,
      }
    });

    return NextResponse.json({
      ...promoCode,
      maxBonusAmount: convertDecimalToNumber(promoCode.maxBonusAmount),
      minDepositAmount: convertDecimalToNumber(promoCode.minDepositAmount),
      commissionPercentage: convertDecimalToNumber(promoCode.commissionPercentage),
    });
  } catch (error) {
    console.log('[ADMIN_PROMO_CODES_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}