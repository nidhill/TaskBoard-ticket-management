import { Router, Response } from 'express';
import Ticket from '../models/Ticket';
import Task from '../models/Task';
import { protect, AuthRequest } from '../middleware/auth';
import { sendNotification } from '../services/notification.service';
import { logAudit } from '../services/audit.service';
import Project from '../models/Project';
import { sendTicketStatusNotification, sendTicketCreatedNotification } from '../services/email.service';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/tickets
// @desc    Get all tickets (with optional filters)
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { taskId, status, priority } = req.query;
        const filter: any = {};

        if (taskId) filter.taskId = taskId;
        if (status) filter.status = status;
        if (priority) filter.priority = priority;

        // Role-based filtering
        if (req.user!.role === 'user') {
            // 1. Find visible projects
            const userProjects = await Project.find({
                $or: [
                    { createdBy: req.user!._id },
                    { projectHeads: req.user!._id },
                    { 'members.user': req.user!._id }
                ]
            }).distinct('_id');

            // 2. Find visible tasks (tasks in visible projects OR assigned to user OR created by user)
            const visibleTasks = await Task.find({
                $or: [
                    { projectId: { $in: userProjects } },
                    { assignedDeveloper: req.user!._id },
                    { createdBy: req.user!._id }
                ]
            }).distinct('_id');

            // 3. Filter tickets: belonging to visible tasks OR requested by user
            filter.$or = [
                { taskId: { $in: visibleTasks } },
                { requestedBy: req.user!._id }
            ];
        }

        const tickets = await Ticket.find(filter)
            .populate('taskId', 'taskName projectId')
            .populate('requestedBy', 'name email avatar_url')
            .sort({ createdAt: -1 });

        res.json({ success: true, tickets });
    } catch (error: any) {
        console.error('Get tickets error:', error);
        res.status(500).json({ message: 'Server error fetching tickets' });
    }
});

// @route   GET /api/tickets/:id
// @desc    Get ticket by ID
// @access  Private
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ticket = await Ticket.findById(req.params.id)
            .populate('taskId', 'taskName projectId')
            .populate('requestedBy', 'name email avatar_url');

        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        if (ticket.requestedBy.toString() !== req.user!._id.toString()) {
            await sendNotification(
                ticket.requestedBy,
                'Ticket Status Updated',
                `Your ticket "${ticket.description.substring(0, 30)}..." has been updated to ${req.body.status}.`,
                req.body.status === 'resolved' ? 'success' : 'info'
            );
        }

        res.json({ success: true, ticket });
    } catch (error: any) {
        console.error('Get ticket error:', error);
        res.status(500).json({ message: 'Server error fetching ticket' });
    }
});

// @route   POST /api/tickets
// @desc    Create new ticket
// @access  Private
router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { taskId, issueType, category, description, priority } = req.body;

        if (!taskId || !issueType || !category || !description) {
            res.status(400).json({ message: 'Please provide all required fields' });
            return;
        }

        // Check if task exists
        const task = await Task.findById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Major Change Limit Logic (2 per Project)
        if (issueType === 'change_request') {
            // Find all tasks in this project to aggregate count
            const projectTaskIds = await Task.find({ projectId: task.projectId }).distinct('_id');

            const majorTicketCount = await Ticket.countDocuments({
                taskId: { $in: projectTaskIds },
                issueType: 'change_request'
            });

            if (majorTicketCount >= 2) {
                res.status(400).json({
                    message: 'Project Major Change limit reached (2/2). Please create a Development Ticket or contact Admin.',
                    type: 'major_change_limit'
                });
                return;
            }
        }

        // Development tickets (bug, dev_bug, enhancement) are UNLIMITED.
        // We still increment task.ticketUsed for analytics/badges, but don't block.

        const ticket = await Ticket.create({
            taskId,
            requestedBy: req.user!._id,
            issueType,
            category,
            description,
            priority: priority || 'medium',
            status: 'open',
        });

        // Increment ticket count on task (for analytics)
        task.ticketUsed += 1;
        await task.save();

        const populatedTicket = await Ticket.findById(ticket._id)
            .populate('taskId', 'taskName')
            .populate('requestedBy', 'name email avatar_url');

        // Notify Task Assignee (Developer)
        if (task.assignedDeveloper && task.assignedDeveloper.toString() !== req.user!._id.toString()) {
            await sendNotification(
                task.assignedDeveloper,
                'New Ticket Created',
                `A new ticket "${description.substring(0, 30)}..." has been created by ${req.user!.name} on your task "${(task as any).taskName}".`,
                'warning'
            );
        }

        // Send Email Notification to Team Members
        try {
            const project = await Project.findById((task as any).projectId).populate({
                path: 'members.user',
                select: 'name email'
            });

            if (project) {
                const projectName = project.name;
                const ticketTitle = description.substring(0, 50) + (description.length > 50 ? '...' : '');

                // Send to all members
                const emailPromises = project.members.map(async (member: any) => {
                    if (member.user && member.user.email) {
                        return sendTicketCreatedNotification(
                            member.user.email,
                            member.user.name,
                            ticketTitle,
                            projectName,
                            req.user!.name
                        );
                    }
                });

                // Do not await strictly to avoid blocking response
                Promise.all(emailPromises).catch(err => console.error('Error sending ticket creation emails:', err));
            }
        } catch (emailErr) {
            console.error('Failed to initiate ticket creation emails:', emailErr);
        }

        await logAudit({
            userId: req.user!._id.toString(),
            action: 'CREATE_TICKET',
            details: `Ticket created in task ${(task as any).taskName}`,
            resourceId: ticket._id.toString(),
            resourceType: 'Ticket'
        });

        res.status(201).json({ success: true, ticket: populatedTicket });
    } catch (error: any) {
        console.error('Create ticket error:', error);
        res.status(500).json({ message: 'Server error creating ticket' });
    }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket
// @access  Private
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ticket = await Ticket.findById(req.params.id);

        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        const oldStatus = ticket.status;

        const updatedTicket = await Ticket.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('taskId', 'taskName')
            .populate('requestedBy', 'name email avatar_url');

        // Audit Log & Email for Status Change
        if (req.body.status && req.body.status !== oldStatus) {
            await logAudit({
                userId: req.user!._id.toString(),
                action: 'UPDATE_TICKET_STATUS',
                details: `Ticket status updated to ${req.body.status}`,
                resourceId: ticket._id.toString(),
                resourceType: 'Ticket'
            });

            // Notify Requester
            if (updatedTicket!.requestedBy && (updatedTicket!.requestedBy as any)._id.toString() !== req.user!._id.toString()) {
                await sendNotification(
                    (updatedTicket!.requestedBy as any)._id,
                    'Ticket Status Updated',
                    `Your ticket "${(updatedTicket as any).description?.substring(0, 30)}..." has been updated to ${req.body.status}.`,
                    req.body.status === 'resolved' ? 'success' : 'info'
                );
            }

            // Send Email to Team Members
            try {
                // We need to fetch the project to get members
                // ticket itself doesn't populate projectId deep enough usually, check ticket->task->project
                const taskForProject = await Task.findById(updatedTicket!.taskId);
                if (taskForProject) {
                    const project = await Project.findById(taskForProject.projectId).populate({
                        path: 'members.user',
                        select: 'name email'
                    });

                    if (project) {
                        const projectName = project.name;
                        const ticketTitle = (updatedTicket as any).description?.substring(0, 50) || 'Ticket';

                        const emailPromises = project.members.map(async (member: any) => {
                            if (member.user && member.user.email) {
                                return sendTicketStatusNotification(
                                    member.user.email,
                                    member.user.name,
                                    ticketTitle,
                                    req.body.status,
                                    projectName
                                );
                            }
                        });

                        Promise.all(emailPromises).catch(err => console.error('Error sending ticket status emails:', err));
                    }
                }
            } catch (emailErr) {
                console.error('Failed to send ticket status email', emailErr);
            }
        }

        res.json({ success: true, ticket: updatedTicket });
    } catch (error: any) {
        console.error('Update ticket error:', error);
        res.status(500).json({ message: 'Server error updating ticket' });
    }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket
// @access  Private
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const ticket = await Ticket.findByIdAndDelete(req.params.id);

        if (!ticket) {
            res.status(404).json({ message: 'Ticket not found' });
            return;
        }

        // Decrement ticket count on task
        await Task.findByIdAndUpdate(ticket.taskId, {
            $inc: { ticketUsed: -1 }
        });

        await logAudit({
            userId: req.user!._id.toString(),
            action: 'DELETE_TICKET',
            details: `Ticket deleted`,
            resourceId: ticket._id.toString(),
            resourceType: 'Ticket'
        });

        res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error: any) {
        console.error('Delete ticket error:', error);
        res.status(500).json({ message: 'Server error deleting ticket' });
    }
});

export default router;
