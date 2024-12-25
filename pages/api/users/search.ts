import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // Get or create current user
    let currentUserId: string;

    // Try to find existing user
    const existingUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!existingUser) {
      // Create user if doesn't exist
      const newUser = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          username: session.user.email.split('@')[0], // Generate username from email
          image: session.user.image || null,
          password: '', // Empty password for OAuth users
          isTemporary: false
        }
      });
      currentUserId = newUser.id;
    } else {
      currentUserId = existingUser.id;
    }

    // Get query parameters
    const { search } = req.query;
    const searchString = typeof search === 'string' ? search : '';

    // Build where clause
    const where: any = {
      NOT: {
        id: currentUserId, // Exclude current user
      }
    };

    // Only add search conditions if there's a search string
    if (searchString.trim()) {
      where.OR = [
        { name: { contains: searchString.toLowerCase() } },
        { email: { contains: searchString.toLowerCase() } },
        { school: { contains: searchString.toLowerCase() } },
        { diploma: { contains: searchString.toLowerCase() } }
      ];
    }

    // Fetch users with their connection status to current user
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        school: true,
        diploma: true,
        studentYear: true,
        bio: true,
        profilePicture: true,
        skillsets: true,
        connections: {
          where: {
            fromUserId: currentUserId,
          },
          select: {
            status: true,
          },
        },
        connectedTo: {
          where: {
            toUserId: currentUserId,
          },
          select: {
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50,
    });

    // Format response
    const formattedUsers = users.map(user => {
      const outgoingConnection = user.connections[0];
      const incomingConnection = user.connectedTo[0];
      
      let connectionStatus = 'NONE';
      if (outgoingConnection) {
        connectionStatus = outgoingConnection.status;
      } else if (incomingConnection) {
        connectionStatus = incomingConnection.status;
      }

      return {
        ...user,
        skillsets: user.skillsets ? JSON.parse(user.skillsets) : [],
        connectionStatus,
        connections: undefined,
        connectedTo: undefined,
      };
    });

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error searching users:', error);
    return res.status(500).json({ error: 'Failed to search users' });
  }
}
