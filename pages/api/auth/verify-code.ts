import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ message: 'Email and code are required' });
    }

    // Find temporary user
    const user = await prisma.user.findFirst({
      where: { 
        email,
        isTemporary: true
      },
      include: { verificationCodes: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find valid verification code
    const validCode = user.verificationCodes.find(vc => 
      vc.code === code && 
      new Date(vc.expires) > new Date()
    );

    if (!validCode) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    // Update user and cleanup codes
    await prisma.$transaction([
      // Mark email as verified
      prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() }
      }),
      // Delete all verification codes for this user
      prisma.verificationCode.deleteMany({
        where: { userId: user.id }
      })
    ]);

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ message: 'Failed to verify code' });
  }
}
