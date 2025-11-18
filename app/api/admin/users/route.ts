import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    console.log('Session in admin users API:', session); // Debug log

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role - adjust this based on your role field
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const whereClause: any = {
      role: 'USER'
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { id: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, totalCount] = await Promise.all([
      db.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isBlocked: true,
          isChatBlocked: true,
          isImageApproved: true,
          createdAt: true,
          image: true, // Include the entire image relation
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      db.user.count({
        where: whereClause,
      })
    ]);

    const validUsers = users.map(user => ({
      id: user.id,
      name: user.name || 'Unknown',
      email: user.email || 'No email',
      role: user.role,
      isBlocked: user.isBlocked,
      isChatBlocked: user.isChatBlocked,
      isImageApproved: user.isImageApproved || 'none',
      createdAt: user.createdAt,
      image: user.image ? {
        id: user.image.id,
        url: user.image.url,
        createdAt: user.image.createdAt,
      } : null
    }));

    const totalPages = Math.ceil(totalCount / limit);

    console.log('Fetched users with images:', validUsers.map(u => ({ 
      id: u.id, 
      hasImage: !!u.image,
      isImageApproved: u.isImageApproved 
    }))); // Debug log

    return NextResponse.json({
      users: validUsers,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (error) {
    console.error('[ADMIN_USERS_API_ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}