import { Request, Response } from 'express';

import { encrypt } from '../utils/crypto';
import { saveRepoDetails } from '../services/mockdb.service';

interface ConnectRepoRequestBody {
  repoUrl: string;
  authType: 'github_oauth' | string;
  authToken: string;
  branch: string;
}

export const connectRepo = async (req: Request, res: Response) => {
  const { repoUrl, authType, authToken, branch } = req.body as ConnectRepoRequestBody;

  if (!repoUrl || !authType || !authToken || !branch) {
    return res.status(400).json({ message: 'Missing required fields in request body' });
  }

  try {
    const encryptedToken = encrypt(authToken);

    // The userId would come from the auth middleware
    const userId = (req as any).user?.id || 'default-user-id';

    const repoId = await saveRepoDetails({
      repoUrl,
      encryptedToken,
      branch,
      userId,
    });

    res.status(201).json({ repoId, status: 'Registered' });
  } catch (error) {
    console.error('Error connecting repo:', error);
    res.status(500).json({ message: 'Failed to connect repository' });
  }
};
