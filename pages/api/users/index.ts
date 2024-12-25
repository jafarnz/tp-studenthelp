import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get all users except the current user
    const users = await prisma.user.findMany({
      where: {
        NOT: {
          id: currentUser.id
        },
        isTemporary: false // Exclude temporary users
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePicture: true,
        school: true,
        diploma: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
}
