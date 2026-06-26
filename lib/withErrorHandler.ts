import { NextApiRequest, NextApiResponse, NextApiHandler } from 'next';
import { sendErrorNotification } from './discord';

export function withErrorHandler(handler: NextApiHandler): NextApiHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error: any) {
      console.error(`[Unhandled API Error in ${req.url}]:`, error);

      if (!res.headersSent) {
        res.status(500).json({ message: 'Internal Server Error' });
      }

      const actualErrorMessage = error?.error?.description || error?.description || error?.message || (typeof error === 'string' ? error : JSON.stringify(error, null, 2));
      const stackTrace = error?.stack || `Error Code: ${error?.error?.code || error?.statusCode || 'Unknown'}\nReason: ${error?.error?.reason || 'Unknown'}`;

      try {
        await sendErrorNotification({
          source: 'Backend',
          errorMessage: actualErrorMessage,
          errorStack: stackTrace,
          url: req.url || 'Unknown API Route',
          context: {
            method: req.method,
            body: req.body,
            query: req.query
          }
        });
      } catch (webhookErr) {
        console.error('Failed to send error webhook:', webhookErr);
      }
    }
  };
}
