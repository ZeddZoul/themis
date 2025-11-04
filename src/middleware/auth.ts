import { Request, Response, NextFunction } from 'express';

// Mock function to simulate fetching a user/api key from Firestore
const getApiKey = async (key: string): Promise<{ key: string; userId: string } | null> => {
  // In a real application, this would query Firestore
  const mockApiKeys: Record<string, { userId: string }> = {
    'test-api-key': { userId: 'user-123' },
  };
  return mockApiKeys[key] ? { key, ...mockApiKeys[key] } : null;
};

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: 'Authorization header is missing' });
  }

  const [type, token] = authHeader.split(' ');

  if (!type || !token) {
    return res.status(401).json({ message: 'Invalid Authorization header format' });
  }

  try {
    if (type.toLowerCase() === 'apikey') {
      const apiKeyData = await getApiKey(token);
      if (!apiKeyData) {
        return res.status(403).json({ message: 'Invalid API Key' });
      }
      // Attach user information to the request for downstream use
      (req as any).user = { id: apiKeyData.userId };
      return next();
    }

    if (type.toLowerCase() === 'bearer') {
      // TODO: Implement OAuth token validation (e.g., using JWT)
      // For now, we'll just allow any bearer token for demonstration
      (req as any).user = { id: 'oauth-user-placeholder' };
      return next();
    }

    return res.status(401).json({ message: 'Unsupported authentication type' });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error during authentication' });
  }
};
