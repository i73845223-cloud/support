"use client";

import { useEffect } from "react";

interface MarkAsReadProps {
    conversationId: string;
}

const MarkAsRead = ({ conversationId }: MarkAsReadProps) => {
    useEffect(() => {
        const markMessagesAsRead = async () => {
            try {
                const response = await fetch(`/api/admin/conversations/${conversationId}/read`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error('Failed to mark messages as read');
                }

                console.log('Messages marked as read successfully');
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        };

        markMessagesAsRead();
    }, [conversationId]);

    return null;
};

export default MarkAsRead;