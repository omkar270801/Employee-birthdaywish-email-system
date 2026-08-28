import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DeveloperTokenPayload } from '../services/developer-auth.service';

export interface DeveloperRequest extends Request {
  developer?: DeveloperTokenPayload;
}

export const authenticateDeveloper = (req: DeveloperRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Developer authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    if (decoded.type !== 'developer') {
      return res.status(403).json({ message: 'Invalid token type' });
    }
    req.developer = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired developer token' });
  }
};
