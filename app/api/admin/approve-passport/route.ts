import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { userId, status } = await request.json();

    if (!userId || !status) {
      return NextResponse.json({ error: 'User ID and status are required' }, { status: 400 });
    }

    if (!['success', 'rejected', 'pending', 'none'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { image: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { isImageApproved: status },
      include: {
        image: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        isImageApproved: updatedUser.isImageApproved,
        image: updatedUser.image ? {
          id: updatedUser.image.id,
          url: updatedUser.image.url,
          createdAt: updatedUser.image.createdAt,
        } : null
      }
    });

  } catch (error: any) {
    console.error('Error approving passport:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update passport status' },
      { status: 500 }
    );
  }
}