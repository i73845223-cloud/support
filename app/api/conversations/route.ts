import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { currentUser } from '@/lib/auth';
 
export async function POST(
  req: Request,
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    if (user.isChatBlocked) {
      return new NextResponse("Chat access blocked", { status: 403 });
    }

    const body = await req.json();
    const { topic } = body;

    const conversation = await db.conversation.create({
      data: {
        topic,
        userId: user.id,
      }
    });

    return NextResponse.json(conversation);
  } catch (error) {
    console.log('[CONVERSATION_POST]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};

export async function GET(
  req: Request,
) {
  try {
    const user = await currentUser();
    if (!user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            body: true,
            createdAt: true,
            isReadByAdmin: true,
            isReadByUser: true,
            userId: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });
  
    return NextResponse.json(conversations);
  } catch (error) {
    console.log('[CONVERSATION_GET]', error);
    return new NextResponse("Internal error", { status: 500 });
  }
};