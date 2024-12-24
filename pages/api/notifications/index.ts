import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
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
        const notifications = await prisma.notification.findMany({
          where: {
            userId: currentUser.id,
          },
          orderBy: {
            createdAt: 'desc'
          },
          take: 50 // Limit to last 50 notifications
        });

        // Parse data field for each notification
        const processedNotifications = notifications.map(notification => ({
          ...notification,
          data: notification.data ? JSON.parse(notification.data) : null
        }));

        return res.status(200).json(processedNotifications);

      case 'PUT':
        const { id } = req.body;
        
        if (!id) {
          return res.status(400).json({ error: 'Notification ID is required' });
        }

        const updatedNotification = await prisma.notification.update({
          where: {
            id,
            userId: currentUser.id
          },
          data: {
            read: true
          }
        });

        return res.status(200).json(updatedNotification);

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Notification API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
