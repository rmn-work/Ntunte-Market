import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'ntunte_dev_secret_key_2026';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        [key: string]: any;
      };
    }
  }
}

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token d’authentification manquant.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token invalide ou expiré.' });
    }
    req.user = user;
    next();
  });
};