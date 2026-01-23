import { Router, Response } from 'express';
import Page from '../models/Page';
import Ticket from '../models/Ticket';
import { protect, AuthRequest } from '../middleware/auth';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/pages
// @desc    Get all pages (with optional filters)
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, status } = req.query;
        const filter: any = {};

        if (projectId) filter.projectId = projectId;
        if (status) filter.status = status;

        const pages = await Page.find(filter)
            .populate('projectId', 'name clientName')
            .populate('assignedDeveloper', 'name email avatar_url')
            .sort({ createdAt: -1 });

        res.json({ success: true, pages });
    } catch (error: any) {
        console.error('Get pages error:', error);
        res.status(500).json({ message: 'Server error fetching pages' });
    }
});

// @route   GET /api/pages/:id
// @desc    Get page by ID
// @access  Private
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = await Page.findById(req.params.id)
            .populate('projectId', 'name clientName')
            .populate('assignedDeveloper', 'name email avatar_url');

        if (!page) {
            res.status(404).json({ message: 'Page not found' });
            return;
        }

        res.json({ success: true, page });
    } catch (error: any) {
        console.error('Get page error:', error);
        res.status(500).json({ message: 'Server error fetching page' });
    }
});

// @route   POST /api/pages
// @desc    Create new page
// @access  Private
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, pageName, assignedDeveloper, status } = req.body;

        if (!projectId || !pageName) {
            res.status(400).json({ message: 'Please provide projectId and pageName' });
            return;
        }

        const page = await Page.create({
            projectId,
            pageName,
            assignedDeveloper,
            createdBy: req.user!._id,
            status: status || 'draft',
            ticketUsed: 0,
            maxTickets: 2,
        });

        await page.populate('createdBy', 'name email');

        res.status(201).json({ success: true, page });
    } catch (error: any) {
        console.error('Create page error:', error);
        res.status(500).json({ message: 'Server error creating page' });
    }
});

// @route   PUT /api/pages/:id
// @desc    Update page
// @access  Private
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = await Page.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('assignedDeveloper', 'name email avatar_url');

        if (!page) {
            res.status(404).json({ message: 'Page not found' });
            return;
        }

        res.json({ success: true, page });
    } catch (error: any) {
        console.error('Update page error:', error);
        res.status(500).json({ message: error.message || 'Server error updating page' });
    }
});

// @route   DELETE /api/pages/:id
// @desc    Delete page
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const page = await Page.findById(req.params.id);

        if (!page) {
            res.status(404).json({ message: 'Page not found' });
            return;
        }

        if (req.user!.role !== 'admin') {
            // Allow deletion if the page has no creator (legacy data) or if the creator matches
            if (page.createdBy && page.createdBy.toString() !== req.user!._id.toString()) {
                res.status(403).json({ message: 'Access denied. You can only delete your own pages.' });
                return;
            }
        }

        await Page.findByIdAndDelete(req.params.id);

        // Also delete associated tickets
        await Ticket.deleteMany({ pageId: req.params.id });

        res.json({ success: true, message: 'Page and associated tickets deleted' });
    } catch (error: any) {
        console.error('Delete page error:', error);
        res.status(500).json({ message: 'Server error deleting page' });
    }
});

export default router;
