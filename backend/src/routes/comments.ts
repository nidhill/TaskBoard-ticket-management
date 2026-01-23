import { Router, Response } from 'express';
import Comment from '../models/Comment';
import Ticket from '../models/Ticket';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/comments
// @desc    Get comments for a ticket
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ticketId } = req.query;

        if (!ticketId) {
            res.status(400).json({ message: 'Ticket ID is required' });
            return;
        }

        const comments = await Comment.find({ ticketId })
            .populate('userId', 'name email avatar_url role')
            .sort({ createdAt: 1 }); // Oldest first (chat style) or Newest first? User prefers threaded usually implies oldest first for flow.

        res.json({ success: true, comments });
    } catch (error: any) {
        console.error('Get comments error:', error);
        res.status(500).json({ message: 'Server error fetching comments' });
    }
});

// @route   POST /api/comments
// @desc    Create a new comment
// @access  Private
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { ticketId, text, attachments } = req.body;

        if (!ticketId || !text) {
            res.status(400).json({ message: 'Ticket ID and text are required' });
            return;
        }

        // Check if ticket exists
        const ticket = await Ticket.findById(ticketId);
        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        const comment = await Comment.create({
            ticketId,
            userId: req.user!._id,
            text,
            attachments: attachments || []
        });

        const populatedComment = await Comment.findById(comment._id)
            .populate('userId', 'name email avatar_url role');

        res.status(201).json({ success: true, comment: populatedComment });
    } catch (error: any) {
        console.error('Create comment error:', error);
        res.status(500).json({ message: 'Server error creating comment' });
    }
});

export default router;
