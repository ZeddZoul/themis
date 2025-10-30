import { Request, Response } from 'express';

import { getRepoDetails } from '../services/mockdb.service';
import { complianceQueue, addComplianceJob } from '../services/queue.service';
import { v4 as uuidv4 } from 'uuid';

export const triggerScan = async (req: Request, res: Response) => {
    const { repoId, commitHash = 'latest' } = req.body;

    if (!repoId) {
        return res.status(400).json({ message: 'Missing required field: repoId' });
    }

    try {
        const repoDetails = await getRepoDetails(repoId);

        if (!repoDetails) {
            return res.status(404).json({ message: 'Repository not found or not registered.' });
        }

        // This would come from your app's logic, maybe associated with the API key
        const appId = 'your-app-id';

        const jobData = {
            repoUrl: repoDetails.repoUrl,
            encryptedToken: repoDetails.encryptedToken,
            branch: repoDetails.branch,
            commitHash,
            appId,
            userId: repoDetails.userId,
        };

        const jobId = uuidv4();
        await addComplianceJob(jobData, jobId);

        res.status(202).json({ jobId, status: 'QUEUED' });
    } catch (error) {
        console.error('Error triggering scan:', error);
        res.status(500).json({ message: 'Failed to queue compliance check job.' });
    }
};

export const getScanStatus = (req: Request, res: Response) => {
  // TODO: Implement scan status logic
  res.status(200).json({ status: 'COMPLETED', reportUrl: '...', riskScore: 85 });
};
