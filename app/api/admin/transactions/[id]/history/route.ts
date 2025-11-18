import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    const pathSegments = pathname.split('/').filter(segment => segment !== '');
    const transactionId = pathSegments[3];
    
    if (!transactionId || transactionId === 'history') {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const user = await currentUser();
    
    if (!user?.id || user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const transaction = await db.transaction.findUnique({
      where: { 
        id: transactionId 
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        history: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!transaction) {
      console.log('Transaction not found:', transactionId);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      transaction,
      statusHistory: transaction.history
    });
    
  } catch (error) {
    console.error('Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}