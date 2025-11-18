import { UserRole } from "@prisma/client"
import NextAuth, { type DefaultSession } from "next-auth"

export type ExtendedUser = DefaultSession['user'] & {
    surname: string
    birth: string
    country: string
    city: string
    role: UserRole
    isTwoFactorEnabled: boolean
    isOAuth: boolean
    isImageApproved: string
    isBlocked: boolean;
    isChatBlocked: boolean;
}

declare module 'next-auth' {
    interface Session {
        user: ExtendedUser
    }
}