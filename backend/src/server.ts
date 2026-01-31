import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import connectDB from './config/database'; // Disabled for debugging

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;

// connectDB(); // Disabled for debugging

app.use(cors());
app.use(express.json());

// Health check route - minimal
app.get('/api/health', (req: Request, res: Response) => {
    res.json({
        status: 'OK',
        message: 'TaskBoard API is running (Minimal Mode)',
        timestamp: new Date().toISOString()
    });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
    console.error('🔥 Server Error:', err);
    res.status(500).json({
        message: 'Internal Server Error',
        error: err.message || 'Unknown Error'
    });
});

app.use((req: Request, res: Response) => {
    res.status(404).json({ message: 'Route not found' });
});

if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
    });
}

export default app;
