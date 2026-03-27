import { Router, Response } from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import { roleCheck } from '../middleware/roleCheck';
import Ticket from '../models/Ticket';
import Task from '../models/Task';
import Project from '../models/Project';

const router = Router();
router.use(protect);

// Helper: convert array of objects to CSV string
const toCSV = (data: any[], columns: { key: string; label: string }[]): string => {
    const header = columns.map((c) => c.label).join(',');
    const rows = data.map((row) =>
        columns.map((c) => {
            const val = c.key.split('.').reduce((obj, k) => obj?.[k], row) ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(',')
    );
    return [header, ...rows].join('\n');
};

// @route   GET /api/export/tickets
// @desc    Export tickets as CSV
// @access  Private (admin)
router.get('/tickets', roleCheck(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tickets = await Ticket.find()
            .populate('taskId', 'taskName')
            .populate('requestedBy', 'name email')
            .lean();

        const columns = [
            { key: '_id', label: 'ID' },
            { key: 'taskId.taskName', label: 'Task' },
            { key: 'requestedBy.name', label: 'Requested By' },
            { key: 'requestedBy.email', label: 'Email' },
            { key: 'issueType', label: 'Issue Type' },
            { key: 'category', label: 'Category' },
            { key: 'priority', label: 'Priority' },
            { key: 'status', label: 'Status' },
            { key: 'description', label: 'Description' },
            { key: 'createdAt', label: 'Created At' },
        ];

        const csv = toCSV(tickets, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tickets.csv"');
        res.send(csv);
    } catch (error: any) {
        console.error('Export tickets error:', error);
        res.status(500).json({ message: 'Error exporting tickets' });
    }
});

// @route   GET /api/export/tasks
// @desc    Export tasks as CSV
// @access  Private (admin)
router.get('/tasks', roleCheck(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const tasks = await Task.find()
            .populate('projectId', 'name')
            .populate('assignedDeveloper', 'name email')
            .populate('createdBy', 'name')
            .lean();

        const columns = [
            { key: '_id', label: 'ID' },
            { key: 'taskName', label: 'Task Name' },
            { key: 'projectId.name', label: 'Project' },
            { key: 'assignedDeveloper.name', label: 'Developer' },
            { key: 'status', label: 'Status' },
            { key: 'priority', label: 'Priority' },
            { key: 'dueDate', label: 'Due Date' },
            { key: 'createdAt', label: 'Created At' },
        ];

        const csv = toCSV(tasks, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="tasks.csv"');
        res.send(csv);
    } catch (error: any) {
        console.error('Export tasks error:', error);
        res.status(500).json({ message: 'Error exporting tasks' });
    }
});

// @route   GET /api/export/projects
// @desc    Export projects as CSV
// @access  Private (admin)
router.get('/projects', roleCheck(['admin']), async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const projects = await Project.find()
            .populate('createdBy', 'name email')
            .lean();

        const columns = [
            { key: '_id', label: 'ID' },
            { key: 'name', label: 'Project Name' },
            { key: 'description', label: 'Description' },
            { key: 'status', label: 'Status' },
            { key: 'createdBy.name', label: 'Created By' },
            { key: 'createdAt', label: 'Created At' },
        ];

        const csv = toCSV(projects, columns);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="projects.csv"');
        res.send(csv);
    } catch (error: any) {
        console.error('Export projects error:', error);
        res.status(500).json({ message: 'Error exporting projects' });
    }
});

export default router;
