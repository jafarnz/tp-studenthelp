import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get user's stats
    const user = await prisma.user.findUnique({
      where: {
        email: session.user?.email || undefined
      },
      include: {
        connections: true,
        studySessions: {
          where: {
            date: {
              gte: new Date()
            }
          }
        },
        _count: {
          select: {
            studySessions: true,
            sharedResources: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const stats = {
      studyPartners: user.connections.length,
      upcomingSessions: user.studySessions.length,
      completedSessions: user._count.studySessions,
      sharedResources: user._count.sharedResources
    };

    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
}
