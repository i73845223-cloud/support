import getConversationById from "@/actions/get-conversation-by-id";
import getMessages from "@/actions/get-messages";
import Body from "../../_components/body";
import Form from "../../_components/form";
import UserHeader from "./header-chat";
import MarkAsRead from "./mark-as-read";

interface IParams {
    supportId: string;
}

const ConversationId = async ({ params }: { params: IParams }) => {
    const conversation = await getConversationById(params.supportId)
    const messages = await getMessages(params.supportId)
    const user = conversation?.user
    const userId = conversation?.user?.id ?? "Unknown";

    if (!conversation || !conversation.user) {
        return <div>Conversation not found</div>;
    }

    return (
        <div className="overflow-y-auto h-full">
            <MarkAsRead conversationId={params.supportId} />
            <UserHeader name={user?.name || user?.email || "Unknown User"} userId={userId} />
            <Body initialMessages={messages} />
            <div className="bg-black w-full px-5 pb-[60px] flex">
                <Form />
            </div>
        </div>
    )
}

export default ConversationId;