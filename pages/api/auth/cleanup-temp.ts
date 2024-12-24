import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Delete temporary users older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isTemporary: true,
        createdAt: {
          lt: oneHourAgo
        }
      }
    });

    return res.status(200).json({ 
      message: `Cleaned up ${deletedUsers.count} temporary users`,
      count: deletedUsers.count
    });
  } catch (error: any) {
    console.error('Error cleaning up temporary users:', error);
    return res.status(500).json({ 
      message: 'Failed to clean up temporary users',
      error: error.message
    });
  }
}
