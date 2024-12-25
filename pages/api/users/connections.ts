import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const userEmail = session.user?.email;
  if (!userEmail) {
    return res.status(400).json({ error: 'User email not found in session' });
  }

  // Get current user id
  const currentUser = await prisma.user.findUnique({
    where: { email: userEmail },
    select: { id: true }
  });

  if (!currentUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const connections = await prisma.connection.findMany({
          where: {
            OR: [
              { fromUserId: currentUser.id, status: 'ACCEPTED' },
              { toUserId: currentUser.id, status: 'ACCEPTED' }
            ]
          },
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

        const formattedConnections = connections.map(conn => {
          const otherUser = conn.fromUserId === currentUser.id ? conn.toUser : conn.fromUser;
          return {
            id: conn.id,
            user: otherUser,
            status: conn.status,
            createdAt: conn.createdAt
          };
        });

        return res.status(200).json(formattedConnections);
      } catch (error) {
        console.error('Error fetching connections:', error);
        return res.status(500).json({ error: 'Failed to fetch connections' });
      }

    case 'POST':
      try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
          return res.status(400).json({ error: 'Target user ID is required' });
        }

        // Check if connection already exists
        const existingConnection = await prisma.connection.findFirst({
          where: {
            OR: [
              {
                fromUserId: currentUser.id,
                toUserId: targetUserId
              },
              {
                fromUserId: targetUserId,
                toUserId: currentUser.id
              }
            ]
          }
        });

        if (existingConnection) {
          return res.status(400).json({ error: 'Connection already exists' });
        }

        // Create new connection
        const connection = await prisma.connection.create({
          data: {
            fromUserId: currentUser.id,
            toUserId: targetUserId,
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

        // Create notification for target user
        await prisma.notification.create({
          data: {
            userId: targetUserId,
            type: 'CONNECTION_REQUEST',
            message: `${session.user.name || 'Someone'} wants to connect with you!`,
            data: JSON.stringify({
              connectionId: connection.id,
              fromUser: {
                id: connection.fromUser.id,
                name: connection.fromUser.name,
                email: connection.fromUser.email,
                profilePicture: connection.fromUser.profilePicture
              }
            })
          }
        });

        return res.status(200).json(connection);
      } catch (error) {
        console.error('Error creating connection:', error);
        return res.status(500).json({ error: 'Failed to create connection' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
