import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '@/lib/prisma';
import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check for existing permanent user
    const existingPermanentUser = await prisma.user.findFirst({
      where: {
        email,
        isTemporary: false
      }
    });

    if (existingPermanentUser) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Delete any existing temporary users with this email
    await prisma.$transaction([
      prisma.verificationCode.deleteMany({
        where: {
          user: {
            email,
            isTemporary: true
          }
        }
      }),
      prisma.user.deleteMany({
        where: {
          email,
          isTemporary: true
        }
      })
    ]);

    // Create new temporary user
    const tempUser = await prisma.user.create({
      data: {
        email,
        username: `temp_${Date.now()}`,
        password: 'temp',
        isTemporary: true
      }
    });

    // Generate verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Create verification code
    await prisma.verificationCode.create({
      data: {
        code,
        expires: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
        userId: tempUser.id
      }
    });

    // Prepare email message
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'TP Study Connect'
      },
      subject: 'Email Verification Code',
      text: `Your verification code is: ${code}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <img src="https://tpstudyconnect.s3.ap-southeast-2.amazonaws.com/logo.png" alt="TP Study Connect Logo" style="width: 150px; margin-bottom: 20px;">
          <h2 style="color: #333;">Welcome to TP Study Connect!</h2>
          <p>Your verification code is:</p>
          <h1 style="color: #E73C37; font-size: 32px; letter-spacing: 5px; margin: 30px 0; padding: 15px; background-color: #f7efe7; border-radius: 8px; display: inline-block;">${code}</h1>
          <p style="color: #666;">This code will expire in 15 minutes.</p>
          <div style="margin-top: 30px; font-size: 12px; color: #666;">
            <p>This is an automated message, please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} TP Study Connect. All rights reserved.</p>
          </div>
        </div>
      `
    };

    // Send email
    try {
      await sgMail.send(msg);
      console.log('Verification email sent successfully');
    } catch (emailError: any) {
      console.error('SendGrid error:', emailError);
      if (emailError.response) {
        console.error(emailError.response.body);
      }
      throw new Error('Failed to send verification email');
    }

    res.status(200).json({ message: 'Verification code sent' });
  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
}
