import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const admin = await currentUser();
    
    if (!admin?.id || admin.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { userId, type, amount, status = 'success' } = await request.json();

    if (!userId || !type || !amount) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    if (!['deposit', 'withdrawal'].includes(type)) {
      return new NextResponse("Invalid transaction type", { status: 400 });
    }

    if (amount <= 0) {
      return new NextResponse("Amount must be greater than 0", { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });

    if (!user) {
      return new NextResponse("User not found", { status: 404 });
    }

    const transaction = await db.transaction.create({
      data: {
        userId,
        type,
        amount,
        status,
        category: 'transaction',
        description: 'manual',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    });

    return NextResponse.json(transaction);
  } catch (error) {
    console.error('[ADMIN_MANUAL_TRANSACTION_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}