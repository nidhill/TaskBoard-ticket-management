import { Router, Response } from 'express';
import Notification from '../models/Notification';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/notifications
// @desc    Get current user's notifications
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notifications = await Notification.find({ userId: req.user!._id })
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({ success: true, notifications });
    } catch (error: any) {
        console.error('Get notifications error:', error);
        res.status(500).json({ message: 'Server error fetching notifications' });
    }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user!._id },
            { read: true },
            { new: true }
        );

        if (!notification) {
            res.status(404).json({ message: 'Notification not found' });
            return;
        }

        res.json({ success: true, notification });
    } catch (error: any) {
        console.error('Update notification error:', error);
        res.status(500).json({ message: 'Server error updating notification' });
    }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        await Notification.updateMany(
            { userId: req.user!._id, read: false },
            { read: true }
        );

        res.json({ success: true, message: 'All notifications marked as read' });
    } catch (error: any) {
        console.error('Mark all read error:', error);
        res.status(500).json({ message: 'Server error updating notifications' });
    }
});

export default router;
