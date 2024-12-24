import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFileToS3(
  file: { filepath: string; mimetype: string; originalFilename: string },
  folder: string = 'profile-pictures'
): Promise<string> {
  try {
    // Verify file exists
    const fileExists = await fs.stat(file.filepath).catch(() => false);
    if (!fileExists) {
      throw new Error(`File does not exist at path: ${file.filepath}`);
    }

    // Read file
    const fileBuffer = await fs.readFile(file.filepath);

    // Generate unique filename
    const fileExtension = file.originalFilename.split('.').pop() || 'jpg';
    const fileName = `${folder}/${uuidv4()}.${fileExtension}`;

    // Upload to S3
    const uploadParams = {
      Bucket: process.env.AWS_S3_BUCKET!,
      Key: fileName,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    await s3Client.send(command);

    // Clean up temp file
    await fs.unlink(file.filepath).catch(console.warn);

    // Generate and return the public URL
    const bucketDomain = `${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;
    const publicUrl = `https://${bucketDomain}/${fileName}`;
    
    return publicUrl;
  } catch (error: any) {
    console.error('Error in uploadFileToS3:', error);
    throw new Error(`Failed to upload to S3: ${error.message}`);
  }
}
