import { NextRequest } from "next/server";
import { currentUser } from "@/lib/auth";
import { addConnection, removeConnection } from "@/lib/connections";

export async function GET(request: NextRequest) {
    const user = await currentUser();
    if (!user?.id) {
        return new Response("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get("conversationId");

    if (!conversationId) {
        return new Response("Missing conversationId", { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            addConnection(conversationId, controller);

            const pingInterval = setInterval(() => {
                try {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "ping" })}\n\n`));
                } catch (error) {
                    clearInterval(pingInterval);
                }
            }, 30000);

            const cleanup = () => {
                clearInterval(pingInterval);
                removeConnection(conversationId, controller);
                controller.close();
            };

            request.signal.addEventListener("abort", cleanup);
            
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));
        },
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}