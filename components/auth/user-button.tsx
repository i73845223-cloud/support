"use client"

import { FaUser } from "react-icons/fa"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { useCurrentUser } from "@/hooks/use-current-user"

export const UserButton = () => {
    const user = useCurrentUser()

    return (
        <Avatar className="cursor-pointer">
            <AvatarImage src={user?.image || ''} />
            <AvatarFallback className="bg-white">
                <FaUser className="text-black" />
            </AvatarFallback>
        </Avatar>
    )
}