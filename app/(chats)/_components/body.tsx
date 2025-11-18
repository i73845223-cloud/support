"use client";

import { FullMessageType } from "@/app/types";
import useConversation from "@/hooks/use-conversation";
import { useEffect, useRef, useState } from "react";
import MessageBox from "./message-box";
import { pusherClient } from "@/lib/pusher";
import { find } from "lodash";
import { useSession } from "next-auth/react";
import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";

interface BodyProps {
    initialMessages: FullMessageType[];
}

const Body: React.FC<BodyProps> = ({ initialMessages }) => {
        const [messages, setMessages] = useState(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { supportId } = useConversation();
    const session = useSession();
    const user = session?.data?.user;
    const router = useRouter();

    useEffect(() => {
        if (!supportId) return;

        const eventSource = new EventSource(`/api/conversations/${supportId}/events?conversationId=${supportId}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                
                if (data.type === 'new_message') {
                    setMessages(current => {
                        const messageExists = current.some(msg => msg.id === data.message.id);
                        if (messageExists) return current;
                        return [...current, data.message];
                    });
                }
            } catch (error) {
                console.error('Error parsing SSE message:', error);
            }
        };

        eventSource.onerror = (error) => {
            console.error('SSE error:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [supportId]);

    useEffect(() => {
        bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        requestAnimationFrame(() => {
            bottomRef?.current?.scrollIntoView({ behavior: "smooth" });
        });
    }, [messages]);

    const handleBackClick = () => {
        router.back();
    };

    return (
        <div className="chat-container">
            {messages.map((message, i) => (
                <MessageBox
                    isLast={i === messages.length - 1}
                    key={message.id}
                    data={message}
                />
            ))}
            <div ref={bottomRef} />
        </div>
    );
};

export default Body;