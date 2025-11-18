import { FullMessageType } from "@/app/types";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface MessageBoxProps {
    data: FullMessageType;
    isLast?: boolean;
}

const MessageBox: React.FC<MessageBoxProps> = ({
    data,
    isLast,
}) => {
    const session = useSession();

    const userId = session?.data?.user?.id;

    const isOwn = userId === data?.sender?.id;

    const container = clsx(
        "flex gap-3 px-4 py-1",
        isOwn && "justify-end"
    );

    const message = clsx(
        "text-sm w-fit overflow-hidden",
        isOwn ? "bg-red-600 text-white" : "bg-gray-800",
        data.image ? "rounded-md p-0" : "rounded-lg py-2 px-3"
    );

    return (
        <div className={container}>
            <div className={message}>
                {data.image ? (
                    <Dialog>
                        <div className="relative">
                            <DialogTrigger asChild>
                                <div>
                                    <Image
                                        alt="image"
                                        height={228}
                                        width={228}
                                        src={data.image}
                                        className="object-cover cursor-pointer hover:scale-110 transition translate"
                                    />
                                    <div className="text-end absolute bottom-1 right-1 bg-black bg-opacity-20 rounded-full px-1 py-0.5">
                                        {format(new Date(data.createdAt), "HH:mm")}
                                    </div>
                                </div>
                            </DialogTrigger>
                            <DialogContent className="bg-transparent border-none">
                                <DialogTitle className="p-3">
                                    <Image
                                        alt="Full Image"
                                        src={data.image}
                                        width={1000}
                                        height={1000}
                                        className="w-full object-contain rounded-md"
                                    />
                                </DialogTitle>
                            </DialogContent>
                        </div>
                    </Dialog>
                ) : (
                    <>
                        <div>{data.body}</div>
                        <div className="text-end">
                            {format(new Date(data.createdAt), "HH:mm")}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default MessageBox;
