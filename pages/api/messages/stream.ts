import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { content, receiverId } = req.body;

    if (!content || !receiverId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true, profilePicture: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: currentUser.id,
        receiverId,
      },
      include: {
        sender: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Trigger Pusher event for real-time updates
    const channelName = [currentUser.id, receiverId].sort().join('-');
    await pusherServer.trigger(channelName, 'new-message', message);

    return res.status(200).json(message);
  }

  if (req.method === 'GET') {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { userId } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch messages between users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: currentUser.id, receiverId: userId },
          { senderId: userId, receiverId: currentUser.id },
        ],
      },
      include: {
        sender: {
          select: {
            name: true,
            profilePicture: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return res.status(200).json(messages);
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
