import { Request, Response, NextFunction } from 'express';

const ADMIN_ADDRESSES = process.env.ADMIN_ADDRESSES?.split(',') || [];

export const adminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { address } = req.headers;
  if (!address || typeof address !== 'string') {
    return res.status(401).json({ error: 'Address header is required' });
  }
  if (!ADMIN_ADDRESSES.includes(address)) {
    return res.status(403).json({ error: 'Unauthorized: Not an admin' });
  }
  next();
};
