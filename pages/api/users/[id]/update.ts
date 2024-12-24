import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    const userId = req.query.id as string;

    if (!session || !session.user?.email) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    // Verify the user is updating their own profile
    if (session.user.id !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { colorScheme, ...otherData } = req.body;

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        colorScheme,
        ...otherData,
      },
    });

    // Return the updated user without sensitive information
    const { password, ...userWithoutPassword } = updatedUser;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
}
