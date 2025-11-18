import { db } from "@/lib/db";

export default async function getConversations() {
  try {
    const conversations = await db.conversation.findMany({
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

    return conversations;
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return [];
  }
}