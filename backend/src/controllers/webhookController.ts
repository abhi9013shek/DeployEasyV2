import { Request, Response, NextFunction } from 'express';
import { webhookService } from '../services/webhookService';

export const webhookController = {
  async handleGitHubWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = (req.headers['x-hub-signature-256'] as string) || '';
      const event = (req.headers['x-github-event'] as string) || '';
      const deliveryId = (req.headers['x-github-delivery'] as string) || '';
      const rawBody = (req as any).rawBody || JSON.stringify(req.body);

      console.log(`[webhookController] Received GitHub Event '${event}', Delivery '${deliveryId}'`);

      if (event !== 'push') {
        return res.status(200).json({
          success: true,
          status: 'IGNORED',
          message: `Event type '${event}' is ignored (only 'push' is supported)`,
        });
      }

      const result = await webhookService.processPushEvent(req.body, signature, rawBody, deliveryId);

      if (result.status === 'INVALID_SIGNATURE') {
        return res.status(401).json({ success: false, ...result });
      }

      if (result.status === 'UNKNOWN_PROJECT') {
        return res.status(404).json({ success: false, ...result });
      }

      // Successful acknowledgement for processed or filtered events
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
