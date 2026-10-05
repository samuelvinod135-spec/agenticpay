import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import healthRouter from './routes/health';
import agentsRouter from './routes/agents';
import walletsRouter from './routes/wallets';
import policiesRouter from './routes/policies';
import transactionsRouter from './routes/transactions';
import paymentRoutes from './routes/paymentRoutes';
import { requireAuth } from './middleware/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

// Enable CORS for frontend and API clients
app.use(cors({
  origin: [frontendUrl, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Public health check route
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Circle USDC Payments route
app.use('/api/v1/payments', paymentRoutes);

// Protected routes (Supabase Auth Bearer token verification)
app.use('/api/agents', requireAuth, agentsRouter);
app.use('/api/wallets', requireAuth, walletsRouter);
app.use('/api/policies', requireAuth, policiesRouter);
app.use('/api/transactions', requireAuth, transactionsRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Path ${req.originalUrl} does not exist on agentic-payments-api`
  });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

app.listen(port, () => {
  console.log(`[agentic-payments-api] Express server running at http://localhost:${port}`);
  console.log(`[agentic-payments-api] Health check: http://localhost:${port}/health`);
});

export default app;
