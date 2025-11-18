import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";

const getConversationById = async (conversationId: string) => {
    try {
        const user = await currentUser();
        if (!user?.id) {
            return null
        }
        
        const conversation = await db.conversation.findUnique({
            where: {
                id: conversationId
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                user: true,
            },
        });

        return conversation
    } catch (error: any) {
        return null
    }
}

export default getConversationById