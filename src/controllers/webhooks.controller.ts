import { Request, Response } from 'express';

export const handleGithubWebhook = (req: Request, res: Response) => {
  // TODO: Implement webhook logic
  res.status(200).json({ status: 'Job queued successfully', jobId: '...' });
};
