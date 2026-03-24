import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cron from 'node-cron';
import connectDB from './config/database';

// Import routes
import authRoutes from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import ticketRoutes from './routes/tickets';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import uploadRoutes from './routes/upload';
import commentRoutes from './routes/comments';
import auditLogRoutes from './routes/audit-logs';
import dashboardRoutes from './routes/dashboard';
import exportRoutes from './routes/export';

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Allowed CORS origins
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://slate-five.vercel.app',
    'https://www.slatee.tech',
    'https://slatee.tech',
    process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Socket.io setup
export const io = new SocketIOServer(httpServer, {
    cors: {
        origin: allowedOrigins,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});

// Socket.io connection handler
io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join user's personal room for targeted notifications
    socket.on('join', (userId: string) => {
        socket.join(`user:${userId}`);
        console.log(`User ${userId} joined room`);
    });

    socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
    });
});

// Rate limiters
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    message: { message: 'Too many attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    message: { message: 'Too many OTP requests. Please try again after 1 hour.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(mongoSanitize()); // NoSQL injection protection
app.use('/uploads', express.static('uploads'));

// Apply rate limiting to auth routes
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', otpLimiter);
app.use('/api/auth/resend-verification', otpLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/audit-logs', auditLogRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);

// Health check route
app.get('/api/health', (req: Request, res: Response) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'OK',
        message: 'TaskBoard API is running',
        mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        timestamp: new Date().toISOString()
    });
});

// Due date reminder cron job — runs every day at 8 AM
cron.schedule('0 8 * * *', async () => {
    try {
        const Task = require('./models/Task').default;
        const { sendDueDateReminder } = require('./services/email.service');
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(23, 59, 59, 999);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasks = await Task.find({
            dueDate: { $gte: today, $lte: tomorrow },
            status: { $ne: 'done' },
        }).populate('assignedDeveloper', 'name email notifications');

        for (const task of tasks) {
            if (task.assignedDeveloper?.email) {
                const user = task.assignedDeveloper;
                if (user.notifications?.email !== false && user.notifications?.ticketUpdates !== false) {
                    await sendDueDateReminder(user.email, user.name, task.taskName, task.dueDate).catch(console.error);
                }
            }
        }
        console.log(`Due date reminders sent for ${tasks.length} tasks`);
    } catch (err) {
        console.error('Cron due date reminder error:', err);
    }
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('Server Error:', err);
    res.status(500).json({ message: 'Internal Server Error', error: err.message || 'Unknown Error' });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
});

export default app;
