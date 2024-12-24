import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  switch (req.method) {
    case 'GET':
      try {
        const resources = await prisma.resource.findMany({
          where: {
            userId: session.user.id
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
            ratings: {
              select: {
                rating: true
              }
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        // Calculate average rating for each resource
        const resourcesWithAvgRating = resources.map(resource => ({
          ...resource,
          averageRating: resource.ratings.length > 0
            ? resource.ratings.reduce((acc, curr) => acc + curr.rating, 0) / resource.ratings.length
            : 0,
        }));

        res.status(200).json(resourcesWithAvgRating);
      } catch (error) {
        console.error('Error fetching resources:', error);
        res.status(500).json({ error: 'Error fetching resources' });
      }
      break;

    case 'POST':
      try {
        const { title, description, type, fileUrl } = req.body;
        
        if (!title || !type || !fileUrl) {
          return res.status(400).json({ error: 'Missing required fields' });
        }

        const resource = await prisma.resource.create({
          data: {
            title,
            description,
            url: fileUrl,
            type,
            userId: session.user.id
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                profilePicture: true,
              },
            },
            ratings: {
              select: {
                rating: true
              }
            },
          },
        });

        res.status(201).json({
          ...resource,
          averageRating: 0,
        });
      } catch (error) {
        console.error('Error creating resource:', error);
        res.status(500).json({ error: 'Error creating resource' });
      }
      break;

    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
