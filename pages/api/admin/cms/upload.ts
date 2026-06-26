import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { getGridFSBucket } from '../../../../lib/gridfs';
import formidable from 'formidable';
import fs from 'fs';
import sharp from 'sharp';
import clientPromise from '../../../../lib/mongodb';

// Disable Next.js default body parser for multipart requests
export const config = {
  api: {
    bodyParser: false,
  },
};

import { withErrorHandler } from '../../../../lib/withErrorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    // Role-based authorization
    if (!session?.user?.email || session.user.role !== 'admin') {
      // Fallback for current project setup since role might not be explicitly populated in session yet
      // but the prompt asked for `session.user.role === "admin"`. If not, we will still check email.
      if (session?.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' });
      }
    }

    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit
    });

    await new Promise<void>((resolve, reject) => {
      form.parse(req, async (err, fields, files) => {
        if (err) {
          console.error('Formidable parse error:', err);
          res.status(400).json({ message: 'Error parsing file upload' });
          return resolve();
        }

        const fileArray = files.file;
        if (!fileArray || fileArray.length === 0) {
          res.status(400).json({ message: 'No file uploaded' });
          return resolve();
        }

        const file = fileArray[0];
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        
        if (!file.mimetype || !validTypes.includes(file.mimetype)) {
          res.status(400).json({ message: 'Invalid file type. Only JPG, JPEG, PNG, and WebP are allowed.' });
          return resolve();
        }

        try {
          const fileBuffer = fs.readFileSync(file.filepath);

          // Process image with Sharp
          const { data: optimizedBuffer, info } = await sharp(fileBuffer)
            .resize({
              width: 1920,
              withoutEnlargement: true,
            })
            .webp({ quality: 80 })
            .toBuffer({ resolveWithObject: true });

          const bucket = await getGridFSBucket();
          const client = await clientPromise;
          const db = client.db();
          
          // Get user ObjectId
          const user = await db.collection('users').findOne({ email: session?.user?.email });
          const uploadedBy = user ? user._id : null;

          // Open GridFS upload stream
          const filename = `${Date.now()}-optimized.webp`;
          const uploadStream = bucket.openUploadStream(filename, {
            metadata: {
              originalFilename: file.originalFilename,
              uploadedBy: uploadedBy,
              uploadedAt: new Date(),
              width: info.width,
              height: info.height,
              size: info.size, // optimized size in bytes
              mimeType: file.mimetype,
              contentType: 'image/webp',
            }
          });

          uploadStream.end(optimizedBuffer);

          uploadStream.on('finish', () => {
            // Cleanup temp file
            if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
            
            res.status(200).json({ 
              message: 'Image uploaded successfully',
              imageId: uploadStream.id.toString(),
              url: `/api/images/${uploadStream.id.toString()}`
            });
            resolve();
          });

          uploadStream.on('error', (uploadErr) => {
            console.error('GridFS upload error:', uploadErr);
            if (fs.existsSync(file.filepath)) fs.unlinkSync(file.filepath);
            res.status(500).json({ message: 'Error saving optimized image' });
            resolve();
          });

        } catch (sharpErr) {
          console.error('Sharp processing error:', sharpErr);
          if (fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
          res.status(500).json({ message: 'Error processing image' });
          resolve();
        }
      });
    });

  } catch (error) {
    console.error('Upload handler error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}


export default withErrorHandler(handler);
