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

  switch (req.method) {
    case 'GET':
      try {
        const connections = await prisma.connection.findMany({
          where: {
            OR: [
              { requesterId: userEmail, status: 'ACCEPTED' },
              { receiverId: userEmail, status: 'ACCEPTED' }
            ]
          },
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            receiver: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            }
          }
        });

        const formattedConnections = connections.map(conn => {
          const otherUser = conn.requesterId === userEmail ? conn.receiver : conn.requester;
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
        const { receiverId } = req.body;
        
        // Check if connection already exists
        const existingConnection = await prisma.connection.findFirst({
          where: {
            OR: [
              { requesterId: userEmail, receiverId },
              { requesterId: receiverId, receiverId: userEmail }
            ]
          }
        });

        if (existingConnection) {
          return res.status(400).json({ error: 'Connection already exists' });
        }

        // Create connection request
        const connection = await prisma.connection.create({
          data: {
            requesterId: userEmail,
            receiverId,
            status: 'PENDING'
          }
        });

        // Create notification for receiver
        await prisma.notification.create({
          data: {
            userId: receiverId,
            type: 'CONNECTION_REQUEST',
            message: `${session.user?.name} wants to connect with you`,
            data: JSON.stringify({ connectionId: connection.id }),
            read: false
          }
        });

        return res.status(201).json(connection);
      } catch (error) {
        console.error('Error creating connection:', error);
        return res.status(500).json({ error: 'Failed to create connection' });
      }

    case 'PUT':
      try {
        const { connectionId, status } = req.body;

        const connection = await prisma.connection.findUnique({
          where: { id: connectionId },
          include: {
            requester: {
              select: { name: true }
            }
          }
        });

        if (!connection) {
          return res.status(404).json({ error: 'Connection not found' });
        }

        if (connection.receiverId !== userEmail) {
          return res.status(403).json({ error: 'Not authorized to update this connection' });
        }

        const updatedConnection = await prisma.connection.update({
          where: { id: connectionId },
          data: { status }
        });

        // Create notification for requester
        await prisma.notification.create({
          data: {
            userId: connection.requesterId,
            type: 'CONNECTION_RESPONSE',
            message: `${session.user?.name} ${status === 'ACCEPTED' ? 'accepted' : 'declined'} your connection request`,
            data: JSON.stringify({ connectionId }),
            read: false
          }
        });

        return res.status(200).json(updatedConnection);
      } catch (error) {
        console.error('Error updating connection:', error);
        return res.status(500).json({ error: 'Failed to update connection' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
