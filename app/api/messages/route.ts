import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

const activeConnections = new Map<string, Set<ReadableStreamDefaultController>>();

export function addConnection(conversationId: string, controller: ReadableStreamDefaultController) {
    if (!activeConnections.has(conversationId)) {
        activeConnections.set(conversationId, new Set());
    }
    activeConnections.get(conversationId)!.add(controller);
}

export function removeConnection(conversationId: string, controller: ReadableStreamDefaultController) {
    const connections = activeConnections.get(conversationId);
    if (connections) {
        connections.delete(controller);
        if (connections.size === 0) {
            activeConnections.delete(conversationId);
        }
    }
}

export function broadcastToConversation(conversationId: string, data: any) {
    const connections = activeConnections.get(conversationId);
    if (connections) {
        const message = `data: ${JSON.stringify(data)}\n\n`;
        connections.forEach(controller => {
            try {
                controller.enqueue(new TextEncoder().encode(message));
            } catch (error) {
                connections.delete(controller);
            }
        });
    }
}

export async function POST(request: Request) {
    try {
        const user = await currentUser();
        if (!user?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }
        if (user.isChatBlocked) {
            return new NextResponse("Chat access blocked", { status: 403 });
        }

        const body = await request.json()
        const { message, image, supportId } = body

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
                        role: true
                    }
                }
            }
        })

        await db.conversation.update({
            where: {
                id: supportId
            },
            data: {
                lastMessageAt: new Date(),
            },
        })

        const messageWithFullData = {
            ...newMessage,
            seen: [],
            isReadByUser: false,
            isReadByAdmin: false
        }

        broadcastToConversation(supportId, {
            type: 'new_message',
            message: messageWithFullData
        });

        return NextResponse.json(newMessage)
    } catch (error: any) {
        console.log(error, 'ERROR_MESSAGES');
        return new NextResponse('InternalError', { status: 500 })
    }
}