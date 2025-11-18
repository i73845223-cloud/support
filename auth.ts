import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { UserRole } from "@prisma/client"

import { db } from "./lib/db"
import authConfig from "./auth.config"
import { getUserById } from "./data/user"
import { getTwoFactorConfirmationByUserId } from "./data/two-factor-confirmation"
import { getAccountByUserId } from "./data/account"

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/login',
    error: '/error',
  },
  events: {
    async linkAccount({ user }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      })
    }
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'credentials') return true

      const existingUser = await getUserById(user.id!)

      if (!existingUser?.emailVerified) return false

      if (existingUser.isTwoFactorEnabled) {
        const twoFactorConfirmation = await getTwoFactorConfirmationByUserId(existingUser.id)

        if (!twoFactorConfirmation) return false

        await db.twoFactorConfirmation.delete({
          where: { id: twoFactorConfirmation.id }
        })
      }

      return true
    },
    async session({ token, session }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }

      if (token.role && session.user) {
        session.user.role = token.role as UserRole;
      }

      if (session.user) {
        session.user.isTwoFactorEnabled = token.isTwoFactorEnabled as boolean;
      }

      if (session.user) {
        session.user.name = token.name || '';
        session.user.email = token.email || '';
        session.user.isOAuth = token.isOAuth as boolean;
      }

      if (session.user) {
        session.user.surname = token.surname as string;
        session.user.birth = token.birth as string;
        session.user.country = token.country as string;
        session.user.city = token.city as string;
      }

      if (session.user) {
        session.user.isChatBlocked = token.isChatBlocked as boolean;
        session.user.isBlocked = token.isBlocked as boolean;
      }

      if (session.user) {
        session.user.isImageApproved = token.isImageApproved as string;
      }

      return session;
    },

    async jwt({ token }) {
      if (!token.sub) return token

      const existingUser = await getUserById(token.sub)

      if (!existingUser) return token

      const existingAccount = await getAccountByUserId(
        existingUser.id
      )

      token.isOAuth = !!existingAccount
      token.name = existingUser.name
      token.surname = existingUser.surname
      token.birth = existingUser.birth
      token.country = existingUser.country
      token.city = existingUser.city
      token.email = existingUser.email
      token.role = existingUser.role
      token.isTwoFactorEnabled = existingUser.isTwoFactorEnabled
      token.isBlocked = existingUser.isBlocked
      token.isChatBlocked = existingUser.isChatBlocked
      token.isImageApproved = existingUser.isImageApproved

      return token
    },
  },
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  ...authConfig,
})