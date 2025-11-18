import { db } from "@/lib/db";

export const getConversationsByUserId = async (userId: string) => {
  try {
    const conversations = await db.conversation.findMany({
      where: {
        userId: userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            body: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return conversations;
  } catch (error) {
    console.error('Error fetching user conversations:', error);
    return null;
  }
};