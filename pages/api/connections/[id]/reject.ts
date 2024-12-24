import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
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
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const connectionId = req.query.id as string;

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, name: true }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get the connection first
    const connection = await prisma.connection.findFirst({
      where: {
        id: connectionId,
        toUserId: currentUser.id,
        status: 'PENDING'
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection request not found' });
    }

    // Update connection status
    const updatedConnection = await prisma.connection.update({
      where: {
        id: connectionId
      },
      data: {
        status: 'REJECTED',
        updatedAt: new Date()
      }
    });

    // Create notification for the connection requester
    await prisma.notification.create({
      data: {
        type: 'CONNECTION_REJECTED',
        userId: connection.fromUser.id,
        message: `${currentUser.name} declined your connection request`,
        data: JSON.stringify({
          connectionId: connectionId,
          userId: currentUser.id,
          status: 'REJECTED'
        })
      }
    });

    return res.status(200).json(updatedConnection);
  } catch (error) {
    console.error('Error rejecting connection:', error);
    return res.status(500).json({ error: 'Failed to reject connection' });
  }
}
