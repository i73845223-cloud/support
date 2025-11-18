import Link from "next/link";
import { format } from "date-fns";
import { getConversationsByUserId } from "@/actions/get-conversation-by-user-id";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, MessageSquare, ArrowLeft } from "lucide-react";

interface UserConversationsPageProps {
  params: {
    userId: string;
  };
}

const UserConversationsPage = async ({ params }: UserConversationsPageProps) => {
  const { userId } = params;
  const conversations = await getConversationsByUserId(userId);

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">User Conversations</h1>
        </div>
        <div className="bg-black rounded-lg border p-8 text-center text-gray-500">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">No conversations found for this user.</p>
        </div>
      </div>
    );
  }

  const user = conversations[0]?.user;

  const sortedConversations = [...conversations].sort((a, b) => {
    const aDate = new Date(a.lastMessageAt || a.updatedAt || a.createdAt).getTime();
    const bDate = new Date(b.lastMessageAt || b.updatedAt || b.createdAt).getTime();
    return bDate - aDate;
  });

  const getActivityStatus = (lastMessage: any) => {
    if (!lastMessage) return 'INACTIVE';
    return new Date(lastMessage.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 
      ? 'ACTIVE' 
      : 'INACTIVE';
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href="/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold">User Conversations</h1>
            <p className="text-sm text-gray-600 mt-1">
              {user?.name || "Unnamed User"} ({user?.email}) • {conversations.length} conversations
            </p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={`/users/${userId}/transactions`}>
            View Transactions
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Conversation</TableHead>
              <TableHead>Last Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last Activity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedConversations.map((conv) => {
              const lastMessage = conv.messages?.[0];
              const activityStatus = getActivityStatus(lastMessage);
              const lastActivityDate = lastMessage?.createdAt 
                ? conv.lastMessageAt || conv.updatedAt || conv.createdAt
                : conv.createdAt;

              return (
                <TableRow key={conv.id} className="">
                  <TableCell className="font-medium">
                    <Link className="flex flex-col" href={`/support/${conv.id}`}>
                      <span className="">
                        {conv.topic || "Untitled Conversation"}
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        ID: {conv.id}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="text-sm text-gray-600 truncate">
                        {lastMessage?.body 
                          ? (lastMessage.body.length > 100 
                              ? lastMessage.body.slice(0, 100) + "..." 
                              : lastMessage.body)
                          : "No messages yet"
                        }
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={activityStatus === 'ACTIVE' ? 'default' : 'secondary'}>
                      {activityStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(conv.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {format(new Date(lastActivityDate), "dd/MM/yyyy HH:mm")}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/support/${conv.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default UserConversationsPage;