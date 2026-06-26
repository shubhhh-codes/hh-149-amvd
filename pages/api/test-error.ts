import { withErrorHandler } from '../../lib/withErrorHandler';
import { NextApiRequest, NextApiResponse } from 'next';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // We intentionally throw a fake error here to test the Global Error Net
  throw new Error("BOOM! 💥 This is a test error from the new Global Error Catcher!");
}

export default withErrorHandler(handler);
