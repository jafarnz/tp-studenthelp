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

    switch (req.method) {
      case 'GET':
        const userData = await prisma.user.findUnique({
          where: {
            email: session.user.email
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            profilePicture: true,
            bio: true,
            school: true,
            diploma: true,
            studentYear: true,
            skillsets: true,
            username: true,
            connections: {
              include: {
                toUser: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    profilePicture: true
                  }
                }
              },
              where: {
                status: 'CONNECTED'
              }
            },
            connectedTo: {
              include: {
                fromUser: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    profilePicture: true
                  }
                }
              },
              where: {
                status: 'CONNECTED'
              }
            }
          }
        });

        if (!userData) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Format response data
        const connections = [
          ...userData.connections.map(conn => conn.toUser),
          ...userData.connectedTo.map(conn => conn.fromUser)
        ];

        const responseData = {
          ...userData,
          connections,
          skillsets: userData.skillsets ? JSON.parse(userData.skillsets) : []
        };

        delete responseData.connectedTo; // Remove redundant data

        return res.status(200).json(responseData);

      case 'PUT':
        const updateData = req.body;
        
        const updatedUser = await prisma.user.update({
          where: { 
            email: session.user.email 
          },
          data: {
            name: updateData.name,
            bio: updateData.bio,
            school: updateData.school,
            diploma: updateData.diploma,
            studentYear: updateData.studentYear,
            skillsets: updateData.skillsets ? JSON.stringify(updateData.skillsets) : undefined
          },
          select: {
            id: true,
            email: true,
            name: true,
            image: true,
            profilePicture: true,
            bio: true,
            school: true,
            diploma: true,
            studentYear: true,
            skillsets: true,
            username: true
          }
        });

        // Format response data
        const updatedResponseData = {
          ...updatedUser,
          skillsets: updatedUser.skillsets ? JSON.parse(updatedUser.skillsets) : []
        };

        return res.status(200).json({ 
          success: true,
          message: 'Profile updated successfully',
          user: updatedResponseData
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('Profile API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
