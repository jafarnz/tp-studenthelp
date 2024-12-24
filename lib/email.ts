import sgMail from '@sendgrid/mail';

// Initialize SendGrid with API key
if (!process.env.SENDGRID_API_KEY) {
  console.error('SENDGRID_API_KEY is not set in environment variables');
  throw new Error('SENDGRID_API_KEY is required');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

interface VerificationEmailOptions {
  to: string;
  code: string;
}

export async function sendVerificationEmail({ to, code }: VerificationEmailOptions) {
  const mailOptions: EmailOptions = {
    to,
    subject: 'Verify Your Email - TP Connect',
    text: `Your verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nIf you didn't request this code, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #ffffff;">
        <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 30px;">Verify Your Email</h1>
        
        <div style="text-align: center; margin: 30px 0;">
          <p style="font-size: 16px; color: #666666; margin-bottom: 20px;">
            Your verification code is:
          </p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 0 auto; width: fit-content;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">
              ${code}
            </span>
          </div>
        </div>

        <p style="text-align: center; color: #666666; font-size: 14px; margin-top: 30px;">
          This code will expire in 10 minutes.<br>
          If you didn't request this code, please ignore this email.
        </p>

        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="color: #666666; font-size: 14px;">
            Need help? Contact us at:<br>
            <a href="mailto:support@tp-connect.edu.sg" style="color: #dc2626; text-decoration: none;">
              support@tp-connect.edu.sg
            </a>
          </p>
        </div>
      </div>
    `,
  };

  return sendEmail(mailOptions);
}

export async function sendEmail({ to, subject, text, html }: EmailOptions) {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL!,
      name: 'TP Connect'
    },
    subject,
    text,
    html
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log('Email sent successfully:', response.statusCode);
    return response;
  } catch (error: any) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('SendGrid API Error:', error.response.body);
    }
    throw error;
  }
}
