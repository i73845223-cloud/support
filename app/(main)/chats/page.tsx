import getConversations from "@/actions/get-conversations";
import Link from "next/link";
import { format } from "date-fns";
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
import { Eye, MessageSquare, User, Mail, MailOpen } from "lucide-react";

const AdminConversationsPage = async () => {
  const conversations = await getConversations();

  if (!conversations || conversations.length === 0) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-bold">All Conversations</h1>
        </div>
        <div className="rounded-lg border p-8 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg">No conversations found.</p>
        </div>
      </div>
    );
  }

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

  const getUnreadMessagesCount = (messages: any[]) => {
    if (!messages) return 0;
    return messages.filter(message => !message.isReadByAdmin).length;
  };

  const hasUnreadMessages = (messages: any[]) => {
    return getUnreadMessagesCount(messages) > 0;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">All Conversations</h1>
          <Badge variant="secondary" className="text-sm">
            {conversations.length} conversations
          </Badge>
        </div>
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Conversation</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Last Message</TableHead>
              <TableHead>Messages</TableHead>
              <TableHead>Unread</TableHead>
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
              const unreadCount = getUnreadMessagesCount(conv.messages || []);
              const hasUnread = hasUnreadMessages(conv.messages || []);

              return (
                <TableRow key={conv.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link className="flex flex-col" href={`/support/${conv.id}`}>
                        <span className="font-semibold">
                          {conv.topic || "Untitled Conversation"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">
                          ID: {conv.id}
                        </span>
                      </Link>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {conv.user?.name || "Unnamed User"}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">
                        {conv.user?.email || "No email"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[200px]">
                      <p className="text-sm truncate font-medium">
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
                    <Badge variant="secondary">
                      {conv.messages?.length || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {unreadCount > 0 ? (
                      <Badge variant="destructive" className="animate-pulse">
                        <Mail className="h-3 w-3 mr-1" />
                        Unread
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        <MailOpen className="h-3 w-3 mr-1" />
                        Read
                      </Badge>
                    )}
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
                    <Button asChild variant={hasUnread ? "default" : "outline"} size="sm">
                      <Link href={`/support/${conv.id}`}>
                        <Eye className="h-4 w-4 mr-2" />
                        View
                        {hasUnread && (
                          <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                            {unreadCount}
                          </Badge>
                        )}
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

export default AdminConversationsPage;