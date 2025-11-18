"use client"

import { UserButton } from "@/components/auth/user-button"
import { signOut } from "next-auth/react"

interface  LogoutButtonProps {
    children?: React.ReactNode
}

export const LogoutButton = ({
    children
}: LogoutButtonProps) => {
    const onClick = () => {
        signOut()
    }

    return (
        <span onClick={onClick} className="cursor-pointer">
            <div className="hidden lg:block">
                <UserButton />
            </div>
        </span>
    )
}