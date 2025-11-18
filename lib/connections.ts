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
            } catch {
                connections.delete(controller);
            }
        });
    }
}
