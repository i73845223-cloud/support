import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id || user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';
    const userId = searchParams.get('userId') || '';

    const skip = (page - 1) * limit;

    const baseWhere = {
      OR: [
        // { description: { contains: 'deposit', mode: 'insensitive' as const } },
        // { description: { contains: 'withdrawal', mode: 'insensitive' as const } },
        { category: 'transaction' }
      ]
    };

    const where: any = { AND: [baseWhere] };

    if (search) {
      where.AND.push({
        OR: [
          { user: { name: { contains: search, mode: 'insensitive' as const } } },
          { user: { email: { contains: search, mode: 'insensitive' as const } } },
          { description: { contains: search, mode: 'insensitive' as const } },
          { category: { contains: search, mode: 'insensitive' as const } },
          { id: { contains: search, mode: 'insensitive' as const } },
        ],
      });
    }

    if (status) {
      where.AND.push({ status });
    }

    if (type) {
      where.AND.push({ type });
    }

    if (dateFrom || dateTo) {
      const dateFilter: any = {};
      if (dateFrom) dateFilter.gte = new Date(dateFrom);
      if (dateTo) dateFilter.lte = new Date(dateTo + 'T23:59:59.999Z');
      where.AND.push({ createdAt: dateFilter });
    }

    if (userId) {
      where.AND.push({ userId });
    }

    const [transactions, totalCount] = await Promise.all([
      db.transaction.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return NextResponse.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext,
        hasPrev,
      }
    });
  } catch (error) {
    console.error('[ADMIN_TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await currentUser();
    
    if (!user?.id || user.role !== 'ADMIN') {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { transactionId, status, note } = await request.json();

    if (!transactionId || !status) {
      return new NextResponse("Transaction ID and status are required", { status: 400 });
    }

    const validStatuses = ['success', 'pending', 'fail'];
    if (!validStatuses.includes(status)) {
      return new NextResponse("Invalid status", { status: 400 });
    }

    const currentTransaction = await db.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!currentTransaction) {
      return new NextResponse("Transaction not found", { status: 404 });
    }

    const result = await db.$transaction(async (tx) => {
      const updatedTransaction = await tx.transaction.update({
        where: { id: transactionId },
        data: { status },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            }
          },
        },
      });

      if (currentTransaction.status !== status) {
        await tx.transactionHistory.create({
          data: {
            transactionId,
            status,
            note: note || `Status changed from ${currentTransaction.status} to ${status} by admin (${user.email})`,
          },
        });
        console.log('Transaction history entry created for status change');
      }

      return updatedTransaction;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[ADMIN_TRANSACTIONS_PATCH]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}