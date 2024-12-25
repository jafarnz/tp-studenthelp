import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';
import { pusherServer } from '@/lib/pusher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Get current user
  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true }
  });

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const { userId } = req.query;

        if (!userId || typeof userId !== 'string') {
          return res.status(400).json({ error: 'User ID is required' });
        }

        // Fetch messages between current user and selected user
        const messages = await prisma.message.findMany({
          where: {
            OR: [
              {
                senderId: currentUser.id,
                receiverId: userId,
              },
              {
                senderId: userId,
                receiverId: currentUser.id,
              },
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
      } catch (error) {
        console.error('Error fetching messages:', error);
        return res.status(500).json({ error: 'Failed to fetch messages' });
      }

    case 'POST':
      try {
        const { content, receiverId } = req.body;

        if (!content || !receiverId) {
          return res.status(400).json({ error: 'Content and receiver ID are required' });
        }

        // Create message and trigger Pusher event in parallel
        const [message] = await Promise.all([
          prisma.message.create({
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
          }),
          // No need to await this separately
          pusherServer.trigger(
            [currentUser.id, receiverId].sort().join('-'),
            'new-message',
            {
              id: `temp-${Date.now()}`, // Will be replaced by real message
              content,
              senderId: currentUser.id,
              receiverId,
              createdAt: new Date().toISOString(),
              sender: {
                name: session.user.name || '',
                profilePicture: session.user.image || null,
              },
            }
          ),
        ]);

        return res.status(201).json(message);
      } catch (error) {
        console.error('Error creating message:', error);
        return res.status(500).json({ error: 'Failed to create message' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
