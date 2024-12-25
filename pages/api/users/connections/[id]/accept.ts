import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST' && req.method !== 'PUT') {
    res.setHeader('Allow', ['POST', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { id: connectionId } = req.query;

  try {
    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the connection
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId as string,
        toUserId: currentUser.id,
        status: 'PENDING'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: { id: connection.id },
      data: { status: 'ACCEPTED' },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        },
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            profilePicture: true
          }
        }
      }
    });

    // Create notification for the requester
    await prisma.notification.create({
      data: {
        userId: connection.fromUser.id,
        type: 'CONNECTION_ACCEPTED',
        message: `${currentUser.name || 'Someone'} accepted your connection request!`,
        data: JSON.stringify({
          connectionId: connection.id,
          user: {
            id: currentUser.id,
            name: currentUser.name
          }
        })
      }
    });

    res.status(200).json({
      success: true,
      connection: {
        id: updatedConnection.id,
        fromUser: updatedConnection.fromUser,
        toUser: updatedConnection.toUser,
        status: updatedConnection.status
      }
    });
  } catch (error) {
    console.error('Error accepting connection:', error);
    res.status(500).json({ error: 'Failed to accept connection' });
  }
}
