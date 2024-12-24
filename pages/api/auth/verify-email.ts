import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ message: 'Invalid token' });
  }

  try {
    const verificationCode = await prisma.verificationCode.findFirst({
      where: { code: token },
      include: { user: true }
    });

    if (!verificationCode) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    const user = verificationCode.user;

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark email as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() }
    });

    // Delete the verification code
    await prisma.verificationCode.delete({
      where: { id: verificationCode.id }
    });

    // Return success message
    res.status(200).json({ 
      message: 'Email verified successfully! You can now sign in.',
      verified: true
    });
  } catch (error) {
    console.error('Error verifying email:', error);
    res.status(500).json({ message: 'Error verifying email' });
  }
}
