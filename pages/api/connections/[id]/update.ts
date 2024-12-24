import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const connectionId = req.query.id as string;
    const { status, meetingLink } = req.body;

    // Verify user is part of the connection
    const connection = await prisma.connection.findUnique({
      where: { id: connectionId },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.fromId !== session.user.id && connection.toId !== session.user.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const otherUserId = connection.fromId === session.user.id ? connection.toId : connection.fromId;

    // Update connection
    const updatedConnection = await prisma.connection.update({
      where: { id: connectionId },
      data: {
        status: status || connection.status,
        meetingLink: meetingLink || connection.meetingLink,
        lastMessageAt: new Date(),
      },
      include: {
        from: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        },
        to: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true,
          }
        }
      }
    });

    // Create notification for the other user
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        type: 'CONNECTION_UPDATE',
        title: 'Connection Status Updated',
        message: `Your connection request has been ${status?.toLowerCase() || 'updated'}`,
      }
    });

    res.status(200).json(updatedConnection);
  } catch (error) {
    console.error('Error updating connection:', error);
    res.status(500).json({ error: 'Error updating connection' });
  }
}
