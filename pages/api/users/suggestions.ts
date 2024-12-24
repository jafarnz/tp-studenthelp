import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get current user's data
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        diploma: true,
        currentModules: true,
        connections: {
          select: { id: true }
        }
      }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get list of users who:
    // 1. Are not the current user
    // 2. Are not already connected with the current user
    // 3. Share the same diploma or modules
    const suggestions = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: currentUser.id } },
          { NOT: { id: { in: currentUser.connections.map(c => c.id) } } },
          {
            OR: [
              { diploma: currentUser.diploma },
              {
                currentModules: {
                  not: null,
                  array_contains: currentUser.currentModules
                }
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        diploma: true,
        currentModules: true,
        interests: true
      },
      take: 20 // Limit to 20 suggestions
    });

    return res.status(200).json(suggestions);
  } catch (error) {
    console.error('Error in suggestions API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
