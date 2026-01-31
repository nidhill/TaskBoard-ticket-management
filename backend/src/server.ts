import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Application = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

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

// Health check route
// Health check route
app.get('/api/health', (req: Request, res: Response) => {
    const mongoose = require('mongoose');
    res.json({
        status: 'OK',
        message: 'TaskBoard API is running',
        mongoStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        mongoState: mongoose.connection.readyState,
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler to calculate errors in Vercel
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('🔥 Server Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message || 'Unknown Error'
    });
});

// 404 handler
app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
// Start server
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
        console.log(`📡 API URL: http://localhost:${PORT}`);
    });
}

export default app;
