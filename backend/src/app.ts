import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './api/routes.js';

export function createApp(): Application {
  const app = express();

  // Middleware - Allow multiple frontend origins for development
  app.use(
    cors({
      origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', config.app.frontendUrl],
      credentials: true,
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: config.app.nodeEnv,
    });
  });

  // API routes
  app.use('/api', apiRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
