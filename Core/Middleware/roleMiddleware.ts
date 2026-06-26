import type { Response, NextFunction } from 'express';
import type { AuthRequest } from './authMiddleware.js';

export const Roles = {
  ADMIN: 1,
  RP: 2,
  MANAGER: 3,
} as const;

export default function requireRole(...allowedRoles: number[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const rolId = (req.user as { rol_id?: number } | undefined)?.rol_id;

    if (rolId === undefined) {
      return res.status(403).json({ message: 'Token does not carry role information' });
    }

    if (!allowedRoles.includes(rolId)) {
      return res.status(403).json({ message: 'Insufficient role permissions' });
    }

    return next();
  };
}
