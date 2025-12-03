import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Basic routes
app.get('/', (_req: Request, res: Response) => {
    res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

const api = express.Router();

api.get('/health', (_req: Request, res: Response) => {
    res.json({ healthy: true, timestamp: Date.now() });
});

// Example placeholder route
api.get('/example', (_req: Request, res: Response) => {
    res.json({ message: 'example route' });
});

app.use('/api', api);

// 404 handler
app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Not Found' });
});

// Error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
        },
    });
});

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});

// Graceful shutdown
const shutdown = (signal: string) => {
    console.log(`Received ${signal}. Closing server...`);
    server.close(() => {
        console.log('Server closed.');
        process.exit(0);
    });
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

export default app;