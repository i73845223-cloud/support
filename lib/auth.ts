import { auth } from "@/auth"
import { db } from "./db";

export const currentUser = async () => {
  const session = await auth();

  if (session?.user?.id) {
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { 
        id: true,
        name: true,
        email: true,
        image: true,
        isImageApproved: true,
        role: true,
        isTwoFactorEnabled: true,
        isBlocked: true,
        isChatBlocked: true,
      }
    });
    return user;
  }

  return null;
};
  
export const currentRole = async () => {
  const session = await auth();
  return session?.user?.role || null;
};