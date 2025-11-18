import { currentUser } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await currentUser(); 

    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userStatus = {
      isImageApproved: user.isImageApproved,
    };

    return NextResponse.json(userStatus);
  } catch (error) {
    console.error('Error in /api/user-status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}