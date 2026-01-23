import { Router, Response } from 'express';
import Project from '../models/Project';
import Page from '../models/Page';
import Ticket from '../models/Ticket';
import { protect, AuthRequest } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import { logAudit } from '../services/audit.service';
import { sendProjectApprovedEmail, sendProjectApprovalRequest, sendProjectMemberNotification, sendProjectStatusNotification } from '../services/email.service';
import User from '../models/User';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/projects
// @desc    Get all projects
// @access  Private
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        let query: any = {};
        const user = req.user!;

        // Role-based filtering
        if (user.role === 'user') {
            // User sees projects they created OR are assigned to
            // Also optionally filter by department if that's still relevant, but PRD focuses on user/admin
            query.$or = [
                { createdBy: user._id },
                { assignedTo: user._id },
                { projectHead: user._id },
                { 'members.user': user._id }
            ];
        }
        // admin sees all (no query filter needed)

        const projects = await Project.find(query)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email') // Populate assigned dev
            .populate('projectHead', 'name email')
            .sort({ createdAt: -1 });

        // Get counts for each project
        const projectsWithCounts = await Promise.all(
            projects.map(async (project) => {
                const pagesCount = await Page.countDocuments({ projectId: project._id });
                const completedPages = await Page.countDocuments({
                    projectId: project._id,
                    status: 'delivered'
                });
                const totalTickets = await Ticket.countDocuments({
                    pageId: { $in: await Page.find({ projectId: project._id }).distinct('_id') }
                });

                return {
                    _id: project._id.toString(),
                    id: project._id.toString(),
                    name: project.name,
                    description: project.description,
                    clientName: project.clientName,
                    startDate: project.startDate,
                    deliveryDate: project.deliveryDate,
                    status: project.status,
                    createdBy: project.createdBy,
                    assignedTo: project.assignedTo,
                    projectHead: project.projectHead,
                    department: project.department,
                    pagesCount,
                    completedPages,
                    totalTickets,
                    createdAt: project.createdAt,
                    updatedAt: project.updatedAt,
                };
            })
        );

        res.json({ success: true, projects: projectsWithCounts });
    } catch (error: any) {
        console.error('Get projects error:', error);
        res.status(500).json({ message: 'Server error fetching projects' });
    }
});

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Private
router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            res.status(400).json({ message: 'Invalid project ID' });
            return;
        }

        const project = await Project.findById(req.params.id)
            .populate('createdBy', 'name email')
            .populate('assignedTo', 'name email')
            .populate('projectHead', 'name email')
            .populate('members.user', 'name email avatar_url');

        if (!project) {
            res.status(404).json({ message: 'Project not found' });
            return;
        }

        // Check permissions
        const user = req.user!;

        if (user.role === 'user') {
            const isCreator = (project.createdBy as any)._id?.toString() === user._id.toString();
            const isAssigned = (project.assignedTo as any)?._id?.toString() === user._id.toString();
            const isProjectHead = (project.projectHead as any)?._id?.toString() === user._id.toString();

            const isMember = project.members.some((m: any) => {
                // Handle populated user object or ID string
                const memberId = m.user._id ? m.user._id.toString() : m.user.toString();
                return memberId === user._id.toString();
            });

            // If strict department isolation is still needed, add here. 
            // For now, allow access if creator or assignee.
            // Also, users in same department might need view access? PRD says "User... Collaborate".
            // Let's stick to strict Creator/Assignee for now or Department match.
            // Given "Collaborate", let's include Department match if defined on project.
            const isSameDept = project.department === user.department;

            if (!isCreator && !isAssigned && !isProjectHead && !isSameDept && !isMember) {
                res.status(403).json({ message: 'Access denied' });
                return;
            }
        }
        // admin has full access

        const pagesCount = await Page.countDocuments({ projectId: project._id });
        const completedPages = await Page.countDocuments({
            projectId: project._id,
            status: 'delivered'
        });

        res.json({
            success: true,
            project: {
                ...project.toObject(),
                pagesCount,
                completedPages,
            },
        });
    } catch (error: any) {
        console.error('Get project error:', error);
        res.status(500).json({ message: 'Server error fetching project' });
    }
});

// @route   POST /api/projects
// @desc    Create new project
// @access  Private (requester, department_head, tech_admin)
router.post(
    '/',
    roleCheck(['admin', 'user']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { name, description, clientName, startDate, deliveryDate, projectHead } = req.body;

            if (!name) {
                res.status(400).json({ message: 'Please provide project name' });
                return;
            }

            if (!projectHead) {
                res.status(400).json({ message: 'Please provide a Project Head' });
                return;
            }

            const project = await Project.create({
                name,
                description: description || '',
                clientName: clientName || '',
                startDate: startDate || new Date(),
                deliveryDate: deliveryDate || new Date(),
                status: 'pending', // Starts as pending approval
                department: req.user!.department,
                createdBy: req.user!._id,
                projectHead,
                members: [
                    ...(req.body.members || []),
                    // Auto-add creator if not already in list
                    ...((req.body.members || []).some((m: any) => m.user === req.user!._id.toString())
                        ? []
                        : [{ user: req.user!._id, role: 'manager' }])
                ],
            });

            // Send email to Project Head
            const headUser = await User.findById(projectHead);
            if (headUser && headUser.email) {
                try {
                    await sendProjectApprovalRequest(headUser.email, project.name, req.user!.name, project._id.toString());
                } catch (emailErr) {
                    console.error('Failed to send approval request email', emailErr);
                }
            }

            // Send email to Team Members
            if (project.members && project.members.length > 0) {
                const memberIds = project.members.map((m: any) => m.user);
                const members = await User.find({ _id: { $in: memberIds } });

                const memberNotificationPromises = members.map(async (member) => {
                    // Skip if member is the creator (already knows) or project head (already emailed)
                    if (member._id.toString() === req.user!._id.toString() || member._id.toString() === projectHead) return;

                    const memberRole = project.members.find((m: any) => m.user.toString() === member._id.toString())?.role || 'member';

                    if (member.email) {
                        return sendProjectMemberNotification(member.email, member.name, project.name, memberRole);
                    }
                });

                Promise.all(memberNotificationPromises).catch(err => console.error('Error sending project member emails:', err));
            }

            await logAudit({
                userId: req.user!._id.toString(),
                action: 'CREATE_PROJECT',
                details: `Project ${project.name} created`,
                resourceId: project._id.toString(),
                resourceType: 'Project'
            });

            res.status(201).json({ success: true, project });
        } catch (error: any) {
            console.error('Create project error:', error);
            res.status(500).json({ message: 'Server error creating project' });
        }
    }
);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Private (admin, user)
router.put(
    '/:id',
    roleCheck(['admin', 'user']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const project = await Project.findById(req.params.id).populate('createdBy', 'name email');

            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }

            const user = req.user!;
            const updates = req.body;

            // Check permissions for updates
            if (user.role === 'user') {
                const isCreator = project.createdBy._id.toString() === user._id.toString();
                // Check if projectHead matches user (project.projectHead is an ID here as it's not populated)
                const isProjectHead = project.projectHead?.toString() === user._id.toString();

                if (!isCreator && !isProjectHead) {
                    res.status(403).json({ message: 'Access denied. Only creator or project head can edit.' });
                    return;
                }

                // Allow Project Head to edit project details even if active/pending
                // Only restrict status changes if not Admin
                if (updates.status && updates.status === 'approved') {
                    res.status(403).json({ message: 'Only Admins can approve projects via direct update.' });
                    return;
                }
            }
            // Admin can do anything

            const updatedProject = await Project.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (updates.status && updates.status !== project.status) {
                await logAudit({
                    userId: req.user!._id.toString(),
                    action: 'UPDATE_PROJECT_STATUS',
                    details: `Project ${project.name} status updated to ${updates.status}`,
                    resourceId: project._id.toString(),
                    resourceType: 'Project'
                });

                // Notify all members about status change
                try {
                    const fullProject = await Project.findById(project._id).populate('members.user', 'name email');
                    if (fullProject && fullProject.members) {
                        const emailPromises = fullProject.members.map(async (m: any) => {
                            if (m.user && m.user.email) {
                                return sendProjectStatusNotification(m.user.email, m.user.name, project.name, updates.status);
                            }
                        });
                        Promise.all(emailPromises).catch(err => console.error('Error sending project status update emails:', err));
                    }
                } catch (emailErr) {
                    console.error('Failed to send project status update emails', emailErr);
                }

                if (updates.status === 'approved') {
                    const creator = project.createdBy as any;
                    if (creator && creator.email) {
                        try {
                            await sendProjectApprovedEmail(creator.email, project.name, creator.name);
                        } catch (emailErr) {
                            console.error('Failed to send approval email', emailErr);
                        }
                    }
                }
            }

            res.json({ success: true, project: updatedProject });
        } catch (error: any) {
            console.error('Update project error:', error);
            res.status(500).json({ message: 'Server error updating project' });
        }
    }
);

// @route   PATCH /api/projects/:id/status
// @desc    Update project status (Approve/Reject)
// @access  Private
router.patch(
    '/:id/status',
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const { status, rejectionReason } = req.body;
            const project = await Project.findById(req.params.id);

            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }

            const user = req.user!;
            // Only Project Head or Admin can approve/reject
            const isProjectHead = project.projectHead?.toString() === user._id.toString();
            const isAdmin = user.role === 'admin';

            if (!isProjectHead && !isAdmin) {
                res.status(403).json({ message: 'Access denied. Only Project Head can approve/reject.' });
                return;
            }

            // Validate status transition
            if (!['active', 'rejected'].includes(status)) {
                res.status(400).json({ message: 'Invalid status for approval/rejection' });
                return;
            }

            project.status = status;
            if (status === 'active') {
                project.approvedAt = new Date();
                // Send email to Creator
                const creator = await User.findById(project.createdBy);
                if (creator && creator.email) {
                    try {
                        await sendProjectApprovedEmail(creator.email, project.name, creator.name);
                    } catch (emailErr) {
                        console.error('Failed to send approval email', emailErr);
                    }
                }

                // Notify all members
                try {
                    const fullProject = await Project.findById(project._id).populate('members.user', 'name email');
                    if (fullProject && fullProject.members) {
                        const emailPromises = fullProject.members.map(async (m: any) => {
                            if (m.user && m.user.email && m.user._id.toString() !== creator?._id.toString()) {
                                return sendProjectStatusNotification(m.user.email, m.user.name, project.name, status);
                            }
                        });
                        Promise.all(emailPromises).catch(err => console.error('Error sending project activation emails:', err));
                    }
                } catch (emailErr) {
                    console.error('Failed to send project activation emails', emailErr);
                }
            } else if (status === 'rejected') {
                project.rejectionReason = rejectionReason;
            }

            await project.save();

            await logAudit({
                userId: user._id.toString(),
                action: 'UPDATE_PROJECT_STATUS',
                details: `Project ${project.name} status updated to ${status}`,
                resourceId: project._id.toString(),
                resourceType: 'Project'
            });

            res.json({ success: true, project });
        } catch (error: any) {
            console.error('Update project status error:', error);
            res.status(500).json({ message: 'Server error updating project status' });
        }
    }
);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Private (tech_admin only)
router.delete(
    '/:id',
    roleCheck(['admin', 'user']),
    async (req: AuthRequest, res: Response): Promise<void> => {
        try {
            const project = await Project.findById(req.params.id);

            if (!project) {
                res.status(404).json({ message: 'Project not found' });
                return;
            }

            // Check permissions
            if (req.user!.role !== 'admin') {
                if (project.createdBy.toString() !== req.user!._id.toString()) {
                    res.status(403).json({ message: 'Access denied. Only creator can delete.' });
                    return;
                }
                // Removed draft check to allow creators to delete any of their projects
                // if (project.status !== 'draft') {
                //    res.status(400).json({ message: 'Cannot delete project unless it is in draft.' });
                //    return;
                // }
            }

            await Project.findByIdAndDelete(req.params.id);

            await logAudit({
                userId: req.user!._id.toString(),
                action: 'DELETE_PROJECT',
                details: `Project ${project.name} deleted`,
                resourceId: project._id.toString(),
                resourceType: 'Project'
            });

            res.json({ success: true, message: 'Project deleted successfully' });
        } catch (error: any) {
            console.error('Delete project error:', error);
            res.status(500).json({ message: 'Server error deleting project' });
        }
    }
);

export default router;
