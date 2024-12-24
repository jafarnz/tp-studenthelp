import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import prisma from '@/lib/prisma';
import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getSession({ req });

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const form = formidable({});
    const [fields, files] = await form.parse(req);
    const file = files.file?.[0];
    const receiverId = fields.receiverId?.[0];

    if (!file || !receiverId) {
      return res.status(400).json({ error: 'File and receiver ID are required' });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(file.filepath, {
      folder: 'messages',
    });

    // Create message with image URL
    const message = await prisma.message.create({
      data: {
        content: `[Image] ${result.secure_url}`,
        senderId: session.user.id,
        receiverId,
        type: 'IMAGE',
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profilePicture: true,
          },
        },
      },
    });

    // Clean up temporary file
    fs.unlinkSync(file.filepath);

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error handling image upload:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
}
