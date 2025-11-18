import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
import { broadcastToConversation } from "@/lib/connections";

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user?.id) return new NextResponse("Unauthorized", { status: 401 });
        if (user.isChatBlocked) return new NextResponse("Chat access blocked", { status: 403 });

        const body = await request.json();
        const { message, image, supportId } = body;

        const newMessage = await db.message.create({
            data: {
                body: message,
                image: image,
                conversatioId: supportId,
                userId: user.id,
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        role: true,
                    },
                },
            },
        });

        await db.conversation.update({
            where: { id: supportId },
            data: { lastMessageAt: new Date() },
        });

        const messageWithFullData = {
            ...newMessage,
            seen: [],
            isReadByUser: false,
            isReadByAdmin: false,
        };

        broadcastToConversation(supportId, {
            type: "new_message",
            message: messageWithFullData,
        });

        return NextResponse.json(newMessage);
    } catch (error) {
        console.error(error, "ERROR_MESSAGES");
        return new NextResponse("InternalError", { status: 500 });
    }
}
