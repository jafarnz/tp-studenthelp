import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const notificationId = req.query.id as string;

  if (!notificationId) {
    return res.status(400).json({ error: 'Notification ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const notification = await prisma.notification.findUnique({
          where: {
            id: notificationId,
            userId: session.user.id
          }
        });

        if (!notification) {
          return res.status(404).json({ error: 'Notification not found' });
        }

        return res.status(200).json(notification);

      case 'PUT':
        const { read } = req.body;

        const updatedNotification = await prisma.notification.update({
          where: {
            id: notificationId,
            userId: session.user.id
          },
          data: {
            read: read ?? true
          }
        });

        return res.status(200).json(updatedNotification);

      case 'DELETE':
        await prisma.notification.delete({
          where: {
            id: notificationId,
            userId: session.user.id
          }
        });

        return res.status(204).end();

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Notification API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
