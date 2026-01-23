import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

export const roleCheck = (allowedRoles: UserRole[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ message: 'Not authorized' });
            return;
        }

        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                message: 'Access denied. Insufficient permissions.',
                requiredRoles: allowedRoles,
                userRole: req.user.role
            });
            return;
        }

        next();
    };
};
