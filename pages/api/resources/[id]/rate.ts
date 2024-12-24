import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const resourceId = req.query.id as string;
    const { rating } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid rating value' });
    }

    // Create rating
    const newRating = await prisma.rating.create({
      data: {
        resourceId,
        userId: session.user.id,
        rating,
      },
      include: {
        resource: {
          include: {
            ratings: {
              select: {
                rating: true
              }
            }
          }
        }
      }
    });

    const averageRating = newRating.resource.ratings.length > 0
      ? newRating.resource.ratings.reduce((acc, curr) => acc + curr.rating, 0) / newRating.resource.ratings.length
      : 0;

    res.status(200).json({ 
      rating: newRating,
      averageRating 
    });
  } catch (error) {
    console.error('Error rating resource:', error);
    res.status(500).json({ error: 'Error rating resource' });
  }
}
