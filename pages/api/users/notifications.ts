import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
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
        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: {
            id: true,
            notifications: {
              orderBy: { createdAt: 'desc' },
              take: 10,
              select: {
                id: true,
                type: true,
                message: true,
                read: true,
                createdAt: true
              }
            }
          }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ notifications: user.notifications });
      } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
      }
      break;

    case 'PUT':
      try {
        const { notificationId } = req.body;
        if (!notificationId) {
          return res.status(400).json({ error: 'Notification ID is required' });
        }

        const user = await prisma.user.findUnique({
          where: { email: userEmail },
          select: { id: true }
        });

        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }

        await prisma.notification.update({
          where: {
            id: notificationId,
            userId: user.id
          },
          data: { read: true }
        });

        res.status(200).json({ message: 'Notification marked as read' });
      } catch (error) {
        console.error('Error updating notification:', error);
        res.status(500).json({ error: 'Failed to update notification' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'PUT']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}
