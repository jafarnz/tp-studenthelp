import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { validateSignupData } from '@/utils/validation';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const validation = validateSignupData(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.error });
    }

    const { email, password, username, school, diploma, studentYear, bio, skillsets, image } = req.body;

    // Find temporary user with verified email
    const tempUser = await prisma.user.findFirst({
      where: {
        email,
        isTemporary: true,
        emailVerified: {
          not: null
        }
      }
    });

    if (!tempUser) {
      return res.status(400).json({ message: 'Please verify your email first' });
    }

    // Check for existing permanent user with same username
    const existingUsername = await prisma.user.findFirst({
      where: {
        username,
        isTemporary: false
      }
    });

    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Use uploaded image or default
    const profileImage = image || 'https://tpstudyconnect.s3.ap-southeast-2.amazonaws.com/default-profile.png';

    // Update temporary user to permanent user
    const user = await prisma.user.update({
      where: { id: tempUser.id },
      data: {
        username,
        password: hashedPassword,
        name: username,
        school: school || '',
        diploma: diploma || '',
        studentYear: parseInt(studentYear) || 1,
        bio: bio || '',
        skillsets: skillsets ? JSON.stringify(skillsets) : '[]',
        isTemporary: false,
        image: profileImage,
        profilePicture: profileImage
      }
    });

    // Delete any other temporary users with this email
    await prisma.user.deleteMany({
      where: {
        email,
        isTemporary: true,
        id: { not: user.id }
      }
    });

    return res.status(201).json({
      message: 'User created successfully',
      redirect: '/auth/signin',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        image: user.image,
        profilePicture: user.profilePicture
      }
    });
  } catch (error: any) {
    console.error('Signup error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    return res.status(500).json({ message: 'Error creating account' });
  }
}
