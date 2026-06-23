import type { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (session?.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { path } = req.body;
    
    if (!path) {
      return res.status(400).json({ message: 'Path to revalidate is required' });
    }

    // Trigger Next.js on-demand revalidation
    await res.revalidate(path);

    return res.status(200).json({ revalidated: true, path });
  } catch (error) {
    console.error('Revalidation error:', error);
    return res.status(500).json({ message: 'Error revalidating path' });
  }
}

