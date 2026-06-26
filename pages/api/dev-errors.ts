import { NextApiRequest, NextApiResponse } from 'next';
import { sendErrorNotification, ErrorData } from '../../lib/discord';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const errorData: ErrorData = req.body;
    await sendErrorNotification(errorData);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Failed to proxy error notification', error);
    res.status(500).json({ success: false });
  }
}
