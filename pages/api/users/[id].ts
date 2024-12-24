import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });
  if (!session?.user?.id) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const userId = req.query.id as string;

  try {
    switch (req.method) {
      case 'GET': {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            name: true,
            email: true,
            bio: true,
            school: true,
            diploma: true,
            studentYear: true,
            profilePicture: true,
            skillsets: true,
            modules: {
              select: {
                type: true,
                module: {
                  select: {
                    id: true,
                    code: true,
                    name: true,
                    description: true,
                  }
                }
              }
            }
          }
        });

        if (!user) {
          return res.status(404).json({ message: 'User not found' });
        }

        // Format modules into expertise and learning goals
        const formattedUser = {
          ...user,
          expertiseModules: user.modules.filter(m => m.type === 'CAN_HELP').map(m => m.module),
          learningModules: user.modules.filter(m => m.type === 'NEED_HELP').map(m => m.module),
        };

        return res.status(200).json(formattedUser);
      }

      case 'PUT': {
        // Only allow users to update their own profile
        if (userId !== session.user.id) {
          return res.status(403).json({ message: 'Not authorized to update this profile' });
        }

        const { name, school, bio, diploma, studentYear, phoneNumber, interests, currentModules, socialLinks, colorScheme, skillsets, rating, completedSessions, modules } = req.body;

        const user = await prisma.user.update({
          where: { id: userId },
          data: {
            name,
            school,
            bio,
            diploma,
            studentYear,
            phoneNumber,
            interests,
            currentModules,
            socialLinks,
            colorScheme,
            skillsets,
            rating,
            completedSessions,
            modules: {
              deleteMany: {},
              create: modules?.map((module: any) => ({
                type: module.type,
                module: {
                  connect: {
                    id: module.module.id
                  }
                }
              }))
            }
          },
          include: {
            modules: true
          }
        });

        return res.status(200).json(user);
      }

      case 'DELETE': {
        // Only allow users to delete their own profile
        if (userId !== session.user.id) {
          return res.status(403).json({ message: 'Not authorized to delete this profile' });
        }

        await prisma.user.delete({
          where: { id: userId }
        });

        return res.status(200).json({ message: 'Profile deleted successfully' });
      }

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ message: `Method ${req.method} not allowed` });
    }
  } catch (error: any) {
    console.error('User API error:', error);
    return res.status(500).json({ 
      message: 'Error processing request',
      error: error.message 
    });
  }
}
