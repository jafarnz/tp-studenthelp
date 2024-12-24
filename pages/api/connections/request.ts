import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { receiverId } = req.body;
    if (!receiverId) {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    const initiator = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    });

    if (!initiator) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          {
            initiatorId: initiator.id,
            receiverId: receiverId
          },
          {
            initiatorId: receiverId,
            receiverId: initiator.id
          }
        ]
      }
    });

    if (existingConnection) {
      return res.status(400).json({ message: 'Connection already exists' });
    }

    // Create connection and notification in a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Create connection request
      const connection = await prisma.connection.create({
        data: {
          initiatorId: initiator.id,
          receiverId: receiverId,
          status: 'PENDING'
        }
      });

      // Create notification for receiver
      const notification = await prisma.notification.create({
        data: {
          userId: receiverId,
          type: 'CONNECTION_REQUEST',
          message: `${initiator.name} wants to connect with you`,
          data: {
            connectionId: connection.id,
            initiatorId: initiator.id,
            initiatorName: initiator.name
          }
        }
      });

      return { connection, notification };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in connection request API:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
