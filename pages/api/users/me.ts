import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    // Debug session data
    console.log('API Session data:', {
      session: session,
      email: session?.user?.email
    });

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Debug database query
    console.log('Looking up user with email:', session.user.email);

    // Get user data from database using email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        username: true,
        image: true,
        profilePicture: true,
        bio: true,
        school: true,
        diploma: true,
        studentYear: true
      }
    });

    // Debug found user
    console.log('Found user:', {
      id: user?.id,
      email: user?.email,
      username: user?.username,
      profilePicture: user?.profilePicture,
      image: user?.image
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      id: user.id,
      email: user.email,
      username: user.username,
      image: user.image,
      profilePicture: user.profilePicture,
      bio: user.bio,
      school: user.school,
      diploma: user.diploma,
      studentYear: user.studentYear
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
