export const generateVerificationEmail = (code: string) => {
  return {
    subject: 'Verify your email for TP Study Connect',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Email Verification</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f7efe7;
              border-radius: 10px;
              padding: 30px;
              margin: 20px 0;
              text-align: center;
            }
            .logo {
              width: 150px;
              margin-bottom: 20px;
            }
            .code {
              font-size: 32px;
              font-weight: bold;
              color: #E73C37;
              letter-spacing: 5px;
              margin: 30px 0;
              padding: 15px;
              background-color: #fff;
              border-radius: 8px;
              display: inline-block;
            }
            .footer {
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="https://tpstudyconnect.s3.ap-southeast-2.amazonaws.com/logo.png" alt="TP Study Connect Logo" class="logo">
            <h1>Verify Your Email</h1>
            <p>Welcome to TP Study Connect! Please use the following verification code to complete your registration:</p>
            <div class="code">${code}</div>
            <p>This code will expire in 15 minutes.</p>
            <p>If you didn't request this verification, you can safely ignore this email.</p>
            <div class="footer">
              <p>This is an automated message, please do not reply.</p>
              <p>&copy; ${new Date().getFullYear()} TP Study Connect. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Your verification code for TP Study Connect is: ${code}
      
      This code will expire in 15 minutes.
      
      If you didn't request this verification, you can safely ignore this email.
    `
  };
};
