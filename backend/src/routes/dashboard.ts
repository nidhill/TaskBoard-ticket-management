import { Router, Response } from 'express';
import Project from '../models/Project';
import Task from '../models/Task';
import Ticket from '../models/Ticket';
import { protect, AuthRequest } from '../middleware/auth';
import mongoose from 'mongoose';

const router = Router();

// All routes are protected
router.use(protect);

// @route   GET /api/dashboard/stats
// @desc    Get aggregated dashboard stats
// @access  Private
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user!._id);
        const userRole = req.user!.role;

        // 1. Projects Query Match Stage
        let projectMatch: any = {};
        if (userRole === 'user') {
            projectMatch.$or = [
                { createdBy: userId },
                { projectHeads: userId },
                { 'members.user': userId },
                { assignedTo: userId }
            ];
        }

        // 2. Fetch Aggregated Project Stats
        // We use aggregation to count projects by status efficiently
        const projectStats = await Project.aggregate([
            { $match: projectMatch },
            {
                $group: {
                    _id: null,
                    totalProjects: { $sum: 1 },
                    activeProjects: {
                        $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                    },
                    completedProjects: {
                        $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] }
                    },
                    pendingProjects: {
                        $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] }
                    }
                }
            }
        ]);

        const pStats = projectStats[0] || { totalProjects: 0, activeProjects: 0, completedProjects: 0, pendingProjects: 0 };

        // 3. Tasks Query Match Stage (Need to find tasks visible to user)
        // For users, we first need the IDs of projects they can access to filter tasks
        let visibleProjectIds: any[] = [];
        if (userRole === 'user') {
            const userProjects = await Project.find(projectMatch).distinct('_id');
            visibleProjectIds = userProjects;
        }

        let taskMatch: any = {};
        if (userRole === 'user') {
            taskMatch.$or = [
                { projectId: { $in: visibleProjectIds } },
                { assignedDeveloper: userId },
                { createdBy: userId }
            ];
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const today = new Date();
        const nextSevenDays = new Date();
        nextSevenDays.setDate(nextSevenDays.getDate() + 7);

        const taskStats = await Task.aggregate([
            { $match: taskMatch },
            {
                $group: {
                    _id: null,
                    // Status Counts
                    to_do: { $sum: { $cond: [{ $eq: ["$status", "to_do"] }, 1, 0] } },
                    in_progress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
                    in_review: { $sum: { $cond: [{ $eq: ["$status", "in_review"] }, 1, 0] } },
                    done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },

                    // Priority Counts (Handling missing as medium)
                    high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                    medium: {
                        $sum: {
                            $cond: [
                                {
                                    $or: [
                                        { $eq: ["$priority", "medium"] },
                                        { $eq: [{ $type: "$priority" }, "missing"] },
                                        { $eq: ["$priority", null] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },

                    // Date Stats
                    doneInLast7Days: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ["$status", "done"] },
                                        { $gte: ["$updatedAt", sevenDaysAgo] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    updatedInLast7Days: {
                        $sum: { $cond: [{ $gte: ["$updatedAt", sevenDaysAgo] }, 1, 0] }
                    },
                    createdInLast7Days: {
                        $sum: { $cond: [{ $gte: ["$createdAt", sevenDaysAgo] }, 1, 0] }
                    },
                    dueInNext7Days: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ["$dueDate", today] },
                                        { $lte: ["$dueDate", nextSevenDays] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);

        const tStats = taskStats[0] || {
            to_do: 0, in_progress: 0, in_review: 0, done: 0,
            high: 0, medium: 0, low: 0,
            doneInLast7Days: 0, updatedInLast7Days: 0, createdInLast7Days: 0, dueInNext7Days: 0
        };

        const tasksByStatus = {
            to_do: tStats.to_do,
            in_progress: tStats.in_progress,
            in_review: tStats.in_review,
            done: tStats.done
        };

        const tasksByPriority = {
            high: tStats.high,
            medium: tStats.medium,
            low: tStats.low
        };

        const recentStats = {
            doneInLast7Days: tStats.doneInLast7Days,
            updatedInLast7Days: tStats.updatedInLast7Days,
            createdInLast7Days: tStats.createdInLast7Days,
            dueInNext7Days: tStats.dueInNext7Days
        };

        const totalTasks = tStats.to_do + tStats.in_progress + tStats.in_review + tStats.done;

        // 4. Tickets Query Match Stage
        // Similar visibility logic for tickets
        let ticketMatch: any = {};
        if (userRole === 'user') {
            // Need visible tasks to filter tickets
            const visibleTaskIds = await Task.find(taskMatch).distinct('_id');
            ticketMatch.$or = [
                { taskId: { $in: visibleTaskIds } },
                { requestedBy: userId }
            ];
        }

        const ticketStats = await Ticket.aggregate([
            { $match: ticketMatch },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const ticketsByStatus = {
            open: 0,
            in_progress: 0,
            resolved: 0,
            rejected: 0
        };
        let totalTickets = 0;

        ticketStats.forEach((stat: any) => {
            if (ticketsByStatus.hasOwnProperty(stat._id)) {
                (ticketsByStatus as any)[stat._id] = stat.count;
            }
            totalTickets += stat.count;
        });

        // 5. Fetch Limit Recent Items (Optimized Projection)
        const recentTickets = await Ticket.find(ticketMatch)
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('taskId', 'taskName')
            .populate('requestedBy', 'name avatar_url'); // Minimal fields

        // For Active Projects, we just fetch a small list with minimal fields
        // Note: The UI might need specific fields, ensure we select them
        const activeProjectsList = await Project.find({ ...projectMatch, status: 'active' })
            .sort({ updatedAt: -1 })
            .limit(5)
            .select('name cliientName status department members startDate deliveryDate');

        // We probably also need totals for the chart (grouped by status is already done above)
        // If the chart needs monthly data, that's a heavier query, but for now let's stick to status counts.

        res.json({
            success: true,
            counts: {
                totalProjects: pStats.totalProjects,
                activeProjects: pStats.activeProjects,
                completedProjects: pStats.completedProjects,
                pendingProjects: pStats.pendingProjects,
                totalTasks,
                tasksByStatus,
                tasksByPriority,
                recentStats,
                totalTickets,
                ticketsByStatus
            },
            recentTickets,
            activeProjects: activeProjectsList
        });

    } catch (error: any) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error fetching dashboard stats' });
    }
});

export default router;
