import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Handle POST request (create connection request)
  if (req.method === 'POST') {
    try {
      const { userId: toUserId } = req.body;

      if (!toUserId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      // Get current user
      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, name: true }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'Current user not found' });
      }

      // Check if connection already exists in either direction
      const existingConnection = await prisma.connection.findFirst({
        where: {
          OR: [
            {
              fromUserId: currentUser.id,
              toUserId: toUserId
            },
            {
              fromUserId: toUserId,
              toUserId: currentUser.id
            }
          ]
        }
      });

      if (existingConnection) {
        if (existingConnection.status === 'PENDING') {
          return res.status(400).json({ error: 'Connection request already pending' });
        } else if (existingConnection.status === 'CONNECTED') {
          return res.status(400).json({ error: 'Already connected' });
        } else if (existingConnection.status === 'REJECTED') {
          // If rejected, allow to try again
          await prisma.connection.delete({
            where: { id: existingConnection.id }
          });
        }
      }

      // Create connection
      const connection = await prisma.connection.create({
        data: {
          fromUserId: currentUser.id,
          toUserId: toUserId,
          status: 'PENDING'
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              school: true,
              diploma: true
            }
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              school: true,
              diploma: true
            }
          }
        }
      });

      // Create notification for connection request
      await prisma.notification.create({
        data: {
          type: 'CONNECTION_REQUEST',
          userId: toUserId,
          message: `${currentUser.name} sent you a connection request`,
          data: JSON.stringify({
            connectionId: connection.id,
            fromUser: {
              id: currentUser.id,
              name: currentUser.name
            }
          })
        }
      });

      return res.status(200).json(connection);
    } catch (error) {
      console.error('Error creating connection:', error);
      return res.status(500).json({ error: 'Failed to create connection' });
    }
  }

  // Handle GET request (get user's connections)
  if (req.method === 'GET') {
    try {
      const { status } = req.query;
      const connections = await prisma.connection.findMany({
        where: {
          OR: [
            {
              fromUserId: session.user.id,
              status: status as string || undefined
            },
            {
              toUserId: session.user.id,
              status: status as string || undefined
            }
          ]
        },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              school: true,
              diploma: true
            }
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true,
              profilePicture: true,
              school: true,
              diploma: true
            }
          }
        }
      });

      return res.status(200).json(connections);
    } catch (error) {
      console.error('Error fetching connections:', error);
      return res.status(500).json({ error: 'Failed to fetch connections' });
    }
  }

  // Handle PUT request (accept/reject connection)
  if (req.method === 'PUT') {
    try {
      const { connectionId, status } = req.body;

      if (!connectionId || !status) {
        return res.status(400).json({ error: 'Connection ID and status are required' });
      }

      if (!['ACCEPTED', 'REJECTED', 'CONNECTED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
      }

      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Update connection status
      const updatedConnection = await prisma.connection.update({
        where: {
          id: connectionId,
          toUserId: currentUser.id,
          status: 'PENDING'
        },
        data: { status },
        include: {
          fromUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          toUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      return res.status(200).json(updatedConnection);
    } catch (error) {
      console.error('Error updating connection:', error);
      return res.status(500).json({ error: 'Failed to update connection' });
    }
  }

  // Handle DELETE request (remove connection)
  if (req.method === 'DELETE') {
    try {
      const { connectionId } = req.query;

      if (!connectionId) {
        return res.status(400).json({ error: 'Connection ID is required' });
      }

      const currentUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true }
      });

      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete connection
      await prisma.connection.delete({
        where: {
          id: connectionId as string,
          OR: [
            { fromUserId: currentUser.id },
            { toUserId: currentUser.id }
          ]
        }
      });

      return res.status(200).json({ message: 'Connection deleted successfully' });
    } catch (error) {
      console.error('Error deleting connection:', error);
      return res.status(500).json({ error: 'Failed to delete connection' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}
