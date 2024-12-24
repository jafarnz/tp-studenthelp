import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
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
                senderId: session.user.id,
                receiverId: userId,
              },
              {
                senderId: userId,
                receiverId: session.user.id,
              },
            ],
          },
          include: {
            sender: {
              select: {
                id: true,
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

        // Create new message
        const message = await prisma.message.create({
          data: {
            content,
            senderId: session.user.id,
            receiverId,
          },
          include: {
            sender: {
              select: {
                id: true,
                name: true,
                profilePicture: true,
              },
            },
          },
        });

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
