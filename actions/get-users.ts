import { db } from '@/lib/db';

export default async function getUsers() {
  try {
    const users = await db.user.findMany({
      where: {
        role: 'USER',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  } catch (error) {
    console.error('[GET_USERS]', error);
    return []; 
  }
}
