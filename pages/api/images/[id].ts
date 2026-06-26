import type { NextApiRequest, NextApiResponse } from 'next';
import { getGridFSBucket } from '../../../lib/gridfs';
import { ObjectId } from 'mongodb';

export const config = {
  api: {
    responseLimit: false,
  },
};

import { withErrorHandler } from '../../../lib/withErrorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string' || !ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid image ID' });
  }

  try {
    const bucket = await getGridFSBucket();
    const objectId = new ObjectId(id);

    // Verify if the file exists
    const files = await bucket.find({ _id: objectId }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ message: 'Image not found' });
    }

    const file = files[0];

    // Set Cache-Control headers for performance
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    
    // GridFS stored WebP via Sharp pipeline
    res.setHeader('Content-Type', file.metadata?.contentType || 'image/webp');
    res.setHeader('Content-Length', file.length);

    // Stream the file back to the client
    const downloadStream = bucket.openDownloadStream(objectId);
    
    downloadStream.on('error', (error) => {
      console.error('Error streaming image from GridFS:', error);
      res.status(500).end();
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('Fetch image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export default withErrorHandler(handler);
