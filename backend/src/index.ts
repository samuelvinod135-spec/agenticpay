import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import healthRouter from './routes/health';
import agentsRouter from './routes/agents';
import walletsRouter from './routes/wallets';
import policiesRouter from './routes/policies';
import transactionsRouter from './routes/transactions';
import paymentRoutes from './routes/paymentRoutes';
import webhookRoutes from './routes/webhookRoutes';
import metricsRouter from './routes/metrics';
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

// Parse JSON with rawBody buffer capture for webhook signature verification
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Parse text/plain bodies (common for AWS SNS notifications used by Circle)
app.use(express.text({ type: ['text/plain', 'application/json'] }));

// Public health check route
app.use('/health', healthRouter);
app.use('/api/health', healthRouter);

// Serve OpenAPI Specification
app.get('/openapi.yaml', (_req: Request, res: Response) => {
  const openApiPath = path.resolve(__dirname, '../../docs/openapi.yaml');
  if (fs.existsSync(openApiPath)) {
    res.setHeader('Content-Type', 'text/yaml');
    res.sendFile(openApiPath);
  } else {
    res.status(404).send('OpenAPI specification not found');
  }
});

// Interactive Swagger & Redoc Documentation Portal
app.get(['/docs', '/api-docs'], (_req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html>
  <head>
    <title>AgenticPay API Reference & Developer Portal</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>body { margin: 0; padding: 0; font-family: 'Inter', sans-serif; }</style>
  </head>
  <body>
    <redoc spec-url="/openapi.yaml"></redoc>
    <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
  </body>
</html>`);
});

// Prometheus Observability metrics route
app.use('/metrics', metricsRouter);

// Circle USDC Payments route & Agent Transaction APIs
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1', paymentRoutes);

// Circle W3S Webhooks route
app.use('/api/v1/webhooks', webhookRoutes);

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
