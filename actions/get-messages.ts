import { db } from "@/lib/db"

const getMessages = async (conversationId: string) => {
    try {
        const messages = await db.message.findMany({
            where: {
                conversatioId: conversationId
            },
            include: {
                sender: true,
            },
            orderBy: {
                createdAt: 'asc'
            }
        })

        return messages
    } catch (error: any) {
        return []
    }
}

export default getMessages