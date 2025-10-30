import { Request, Response } from 'express';

export const triggerScan = (req: Request, res: Response) => {
  // TODO: Implement scan trigger logic
  res.status(200).json({ jobId: 'uuid-v4', status: 'QUEUED' });
};

export const getScanStatus = (req: Request, res: Response) => {
  // TODO: Implement scan status logic
  res.status(200).json({ status: 'COMPLETED', reportUrl: '...', riskScore: 85 });
};
