import { NextApiRequest, NextApiResponse } from 'next';
import { unstable_getServerSession } from 'next-auth';
import formidable from 'formidable';
import { uploadFileToS3 } from '@/utils/s3';
import Cors from 'cors';
import { authOptions } from './auth/[...nextauth]';

// Initialize CORS
const cors = Cors({
  methods: ['POST', 'OPTIONS'],
  credentials: true,
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost',
      process.env.NEXT_PUBLIC_APP_URL,
    ].filter(Boolean);

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
});

// CORS middleware
function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    console.log('Starting upload handler...');

    // Run CORS middleware
    await runMiddleware(req, res, cors);

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Parse form data first to check if it's a signup request
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      allowEmptyFiles: false,
      filter: (part) => {
        return part.mimetype?.startsWith('image/') || false;
      },
    });

    console.log('Parsing form data...');

    // Parse the form
    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Form parsing error:', err);
          reject(err);
        } else {
          console.log('Form parsed successfully:', {
            fields: Object.keys(fields),
            files: Object.keys(files),
          });
          resolve([fields, files]);
        }
      });
    });

    // Check authentication unless it's a signup request
    const isSignup = fields.isSignup?.[0] === 'true';
    console.log('Is signup request:', isSignup);

    if (!isSignup) {
      const session = await unstable_getServerSession(req, res, authOptions);
      if (!session?.user?.email) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
    }

    const file = files.file?.[0];
    if (!file) {
      console.error('No file found in request');
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File details:', {
      name: file.originalFilename,
      type: file.mimetype,
      size: file.size,
    });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.' 
      });
    }

    try {
      console.log('Starting S3 upload...');
      // Upload to S3
      const fileUrl = await uploadFileToS3(file);
      console.log('S3 upload successful:', fileUrl);
      
      return res.status(200).json({
        url: fileUrl,
      });
    } catch (error: any) {
      console.error('Error uploading to S3:', error);
      return res.status(500).json({ 
        error: 'Error uploading file to storage',
        details: error.message,
        stack: error.stack
      });
    }
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return res.status(500).json({ 
      error: 'Error processing upload',
      details: error.message,
      stack: error.stack
    });
  }
}
