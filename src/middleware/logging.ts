import { Request, Response, NextFunction } from 'express';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // TODO: Implement logging logic
  console.log(`${req.method} ${req.path}`);
  next();
};
