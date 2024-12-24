import { NextApiRequest, NextApiResponse } from 'next';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Log environment variables (redacted)
    console.log('AWS Configuration:', {
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
      accessKeyId: process.env.AWS_ACCESS_KEY_ID?.substring(0, 5) + '...',
    });

    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      logger: console,
    });

    // Try to list buckets to test credentials
    const command = new ListBucketsCommand({});
    const response = await s3Client.send(command);

    return res.status(200).json({
      success: true,
      buckets: response.Buckets?.map(b => b.Name) || [],
      region: process.env.AWS_REGION,
      bucket: process.env.AWS_S3_BUCKET,
    });
  } catch (error: any) {
    console.error('S3 test error:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });

    return res.status(500).json({
      error: 'Failed to connect to S3',
      details: error.message,
      code: error.code,
    });
  }
}
