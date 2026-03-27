import { Router, Response } from 'express';
import AuditLog from '../models/AuditLog';
import { protect, AuthRequest } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';

const router = Router();

// All routes are protected and require ADMIN role
router.use(protect);
router.use(roleCheck(['admin']));

// @route   GET /api/audit-logs
// @desc    Get all audit logs
// @access  Private (Admin only)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { limit = 50, action, resourceType } = req.query;
        const filter: any = {};

        if (action) filter.action = action;
        if (resourceType) filter.resourceType = resourceType;

        const logs = await AuditLog.find(filter)
            .populate('userId', 'name email role')
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({ success: true, logs });
    } catch (error: any) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ message: 'Server error fetching audit logs' });
    }
});

export default router;
