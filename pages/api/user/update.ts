import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      name,
      bio,
      school,
      diploma,
      studentYear,
      image,
      teamsId,
      phoneNumber,
      interests,
      currentModules,
      colorScheme,
      socialLinks,
    } = req.body;

    // Update user data
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        name,
        bio,
        school,
        diploma,
        studentYear,
        image,
        teamsId,
        phoneNumber,
        interests,
        currentModules,
        colorScheme,
        socialLinks,
      }
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
}
