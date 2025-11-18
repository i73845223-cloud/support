import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function POST(request: NextRequest) {
  try {
    const { userId, statusType, value } = await request.json();

    console.log('🔧 Updating user status:', { userId, statusType, value });

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (statusType !== 'isBlocked' && statusType !== 'isChatBlocked') {
      return NextResponse.json(
        { error: 'Invalid status type' },
        { status: 400 }
      );
    }

    const session = await auth();
    console.log('🔧 Session user:', session?.user);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    if (session.user.id === userId) {
      return NextResponse.json(
        { error: 'Cannot modify your own status' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { [statusType]: value },
    });

    console.log('✅ User updated successfully:', updatedUser.id);

    const userResponse = {
      id: updatedUser.id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      isBlocked: updatedUser.isBlocked,
      isChatBlocked: updatedUser.isChatBlocked,
    };

    return NextResponse.json(userResponse);
    
  } catch (error) {
    console.error('❌ [USER_UPDATE_API_ERROR]', error);
    
    if (error instanceof Error) {
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update user status' },
      { status: 500 }
    );
  }
}