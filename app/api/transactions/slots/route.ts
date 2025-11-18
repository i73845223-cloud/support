import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (userId !== user.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const transactions = await db.transaction.findMany({
      where: {
        userId: user.id,
        OR: [
          { description: { contains: 'slot' } },
          { description: { contains: 'spin' } },
          { description: { contains: 'win' } },
          { category: 'slots' }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ transactions });
  } catch (error) {
    console.log('[SLOT_TRANSACTIONS_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
}