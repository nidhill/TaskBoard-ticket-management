import { Router, Response } from 'express';
import Task from '../models/Task';
import Ticket from '../models/Ticket';
import Project from '../models/Project';
import { protect, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notification.service';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/tasks
// @desc    Get all tasks (with optional filters)
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, status } = req.query;
        const filter: any = {};

        if (projectId) filter.projectId = projectId;
        if (status) filter.status = status;

        // Role-based filtering
        if (req.user!.role === 'user') {
            // Find projects user has access to
            const userProjects = await Project.find({
                $or: [
                    { createdBy: req.user!._id },
                    { projectHeads: req.user!._id },
                    { 'members.user': req.user!._id }
                ]
            }).distinct('_id');

            // Filter tasks:
            // 1. Task belongs to a visible project
            // 2. Task is assigned to user
            // 3. Task was created by user
            filter.$or = [
                { projectId: { $in: userProjects } },
                { assignedDeveloper: req.user!._id },
                { createdBy: req.user!._id }
            ];
        }

        const tasks = await Task.find(filter)
            .populate('projectId', 'name clientName')
            .populate('assignedDeveloper', 'name email avatar_url')
            .sort({ createdAt: -1 });

        res.json({ success: true, tasks });
    } catch (error: any) {
        console.error('Get tasks error:', error);
        res.status(500).json({ message: 'Server error fetching tasks' });
    }
});

// @route   GET /api/tasks/:id
// @desc    Get task by ID
// @access  Private
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('projectId', 'name clientName projectHeads')
            .populate('assignedDeveloper', 'name email avatar_url');

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        res.json({ success: true, task });
    } catch (error: any) {
        console.error('Get task error:', error);
        res.status(500).json({ message: 'Server error fetching task' });
    }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { projectId, taskName, assignedDeveloper, status, description, priority, dueDate, startDate, attachments, urls } = req.body;

        if (!projectId || !taskName) {
            res.status(400).json({ message: 'Please provide projectId and taskName' });
            return;
        }

        const task = await Task.create({
            projectId,
            taskName,
            description,
            priority,
            dueDate,
            startDate,
            assignedDeveloper,
            attachments: attachments || [],
            urls: urls || [],
            createdBy: req.user!._id,
            status: status || 'draft',
            ticketUsed: 0,
            maxTickets: 2,
        });

        if (assignedDeveloper) {
            await sendNotification(
                assignedDeveloper,
                'New Task Assigned',
                `You have been assigned to task "${taskName}".`,
                'info'
            );
        }

        await task.populate('createdBy', 'name email');

        res.status(201).json({ success: true, task });
    } catch (error: any) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error creating task' });
    }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('assignedDeveloper', 'name email avatar_url');

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        res.json({ success: true, task });
    } catch (error: any) {
        console.error('Update task error:', error);
        res.status(500).json({ message: error.message || 'Server error updating task' });
    }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        if (req.user!.role !== 'admin') {
            // Allow deletion if the task has no creator (legacy data) or if the creator matches
            if (task.createdBy && task.createdBy.toString() !== req.user!._id.toString()) {
                res.status(403).json({ message: 'Access denied. You can only delete your own tasks.' });
                return;
            }
        }

        await Task.findByIdAndDelete(req.params.id);

        // Also delete associated tickets
        await Ticket.deleteMany({ taskId: req.params.id });

        res.json({ success: true, message: 'Task and associated tickets deleted' });
    } catch (error: any) {
        console.error('Delete task error:', error);
        res.status(500).json({ message: 'Server error deleting task' });
    }
});

export default router;
