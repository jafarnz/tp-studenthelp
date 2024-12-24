import { NextApiRequest, NextApiResponse } from 'next';
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

    // Prepare test email
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL!,
        name: 'TP Study Connect'
      },
      subject: 'Test Email',
      text: 'This is a test email from TP Study Connect',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #333;">Test Email</h2>
          <p>This is a test email from TP Study Connect.</p>
          <p>If you received this, the email system is working correctly!</p>
        </div>
      `
    };

    // Send email
    try {
      await sgMail.send(msg);
      console.log('Test email sent successfully');
      res.status(200).json({ message: 'Test email sent' });
    } catch (emailError: any) {
      console.error('SendGrid error:', emailError);
      if (emailError.response) {
        console.error(emailError.response.body);
      }
      throw new Error('Failed to send test email');
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ error: 'Failed to send test email' });
  }
}
