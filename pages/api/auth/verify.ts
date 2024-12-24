import type { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }

    // Find the verification code
    const verificationCode = await prisma.verificationCode.findFirst({
      where: {
        code,
        user: {
          email
        },
        type: 'EMAIL',
        expires: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!verificationCode) {
      return res.status(400).json({ message: 'Invalid or expired verification code' });
    }

    // Mark user's email as verified and not temporary
    const updatedUser = await prisma.user.update({
      where: { id: verificationCode.user.id },
      data: { 
        emailVerified: new Date(),
        isTemporary: false
      }
    });

    // Delete the verification code
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id }
    });

    return res.status(200).json({ 
      message: 'Email verified successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        username: updatedUser.username,
        image: updatedUser.image,
        profilePicture: updatedUser.profilePicture,
        emailVerified: updatedUser.emailVerified
      }
    });
  } catch (error: any) {
    console.error('Error verifying code:', error);
    return res.status(500).json({ 
      message: 'Error verifying code',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
