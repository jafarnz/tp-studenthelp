import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('Profile API called');
  
  if (req.method !== 'GET' && req.method !== 'PUT') {
    console.log('Invalid method:', req.method);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  console.log('Session:', session);

  if (!session) {
    console.log('No session found');
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!session.user?.email) {
    console.log('No user email found');
    return res.status(400).json({ error: 'User email not found' });
  }

  try {
    console.log('Finding user with email:', session.user.email);
    
    // First try to find the user
    let user = await prisma.user.findUnique({
      where: {
        email: session.user.email
      }
    });

    // If user doesn't exist, create them
    if (!user) {
      console.log('User not found, creating new user');
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          name: session.user.name || '',
          image: session.user.image || ''
        }
      });
      console.log('Created new user:', user);
    }

    if (req.method === 'GET') {
      // Now get the full user data
      console.log('Getting full user data');
      const userData = await prisma.user.findUnique({
        where: {
          email: session.user.email
        },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          bio: true,
          phone: true,
          currentModules: true,
          skillsets: true,
          interests: true,
          socialLinks: true,
          colorScheme: true,
          diploma: true,
          connections: {
            select: {
              id: true,
              name: true,
              image: true,
              diploma: true
            }
          }
        }
      });

      if (!userData) {
        console.log('User data not found after creation');
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Raw user data:', userData);

      // Parse JSON strings if they exist
      const parsedUser = {
        ...userData,
        currentModules: userData.currentModules ? JSON.parse(userData.currentModules as string) : [],
        skillsets: userData.skillsets ? JSON.parse(userData.skillsets as string) : [],
        interests: userData.interests ? JSON.parse(userData.interests as string) : [],
        socialLinks: userData.socialLinks ? JSON.parse(userData.socialLinks as string) : {
          linkedin: '',
          github: '',
          portfolio: ''
        },
        colorScheme: userData.colorScheme ? JSON.parse(userData.colorScheme as string) : {
          from: '#8E2DE2',
          to: '#4A00E0'
        }
      };

      console.log('Parsed user data:', parsedUser);
      res.status(200).json(parsedUser);
    }

    if (req.method === 'PUT') {
      console.log('Updating user data');
      const {
        name,
        bio,
        school,
        diploma,
        studentYear,
        teamsId,
        phoneNumber,
        interests,
        currentModules,
        socialLinks,
        colorScheme,
        skillsets,
      } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: name || undefined,
          bio: bio || undefined,
          school: school || undefined,
          diploma: diploma || undefined,
          studentYear: studentYear || undefined,
          teamsId: teamsId || undefined,
          phoneNumber: phoneNumber || undefined,
          interests: interests || undefined,
          currentModules: currentModules || undefined,
          socialLinks: socialLinks || undefined,
          colorScheme: colorScheme || undefined,
          skillsets: skillsets || undefined,
        },
        select: {
          id: true,
          name: true,
          email: true,
          bio: true,
          school: true,
          diploma: true,
          studentYear: true,
          image: true,
          teamsId: true,
          phoneNumber: true,
          interests: true,
          currentModules: true,
          socialLinks: true,
          colorScheme: true,
          skillsets: true,
        }
      });

      console.log('Updated user data:', updatedUser);
      return res.status(200).json(updatedUser);
    }
  } catch (error) {
    console.error('Error in profile API:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
}
