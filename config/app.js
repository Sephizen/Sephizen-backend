import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './env.js';
import { apiRateLimiter, authRateLimiter, uploadRateLimiter } from '../middleware/rateLimit.js';
import { notFoundHandler } from '../middleware/notFound.js';
import { errorHandler } from '../middleware/errorHandler.js';
import { requestIdMiddleware } from '../middleware/requestId.js';
import { requestLogger } from '../middleware/requestLogger.js';
import { logUsage } from '../services/usageService.js';

import authRoutes from '../routes/authRoutes.js';
import healthRoutes from '../routes/healthRoutes.js';
import chatRoutes from '../routes/chatRoutes.js';
import creditsRoutes from '../routes/creditsRoutes.js';
import modelsRoutes from '../routes/modelsRoutes.js';
import usageRoutes from '../routes/usageRoutes.js';
import profileRoutes from '../routes/profileRoutes.js';
import settingsRoutes from '../routes/settingsRoutes.js';
import uploadRoutes from '../routes/uploadRoutes.js';
import metricsRoutes from '../routes/metricsRoutes.js';

function buildCorsOrigins() {
  const origins = new Set();
  if (env.FRONTEND_URL) origins.add(env.FRONTEND_URL);
  if (env.ALLOWED_ORIGINS) {
    for (const item of env.ALLOWED_ORIGINS.split(',').map((s) => s.trim()).filter(Boolean)) {
      origins.add(item);
    }
  }
  return [...origins];
}

function buildCorsOptions() {
  const allowedOrigins = buildCorsOrigins();
  const isProduction = env.NODE_ENV === 'production';

  return {
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      if (!isProduction && allowedOrigins.length === 0) return callback(null, true);
      return callback(new Error('CORS policy blocks this origin'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'X-Request-Id']
  };
}

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.locals.usageLogger = (payload) => logUsage(payload);

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false
    })
  );

  app.use(cors(buildCorsOptions()));
  app.use((req, res, next) => {
    res.vary('Origin');
    next();
  });
  app.use(requestIdMiddleware);
  app.use(express.json({ limit: env.REQUEST_BODY_LIMIT }));
  app.use(express.urlencoded({ extended: true, limit: env.REQUEST_BODY_LIMIT }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.use(requestLogger);

  app.use('/api', apiRateLimiter);
  app.use('/api/auth', authRateLimiter);
  app.use('/api/upload', uploadRateLimiter);

  app.get('/', (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'public-ai-coding-assistant-backend',
        status: 'running'
      }
    });
  });

  app.use('/api/health', healthRoutes);
  app.use('/api/auth', authRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/credits', creditsRoutes);
  app.use('/api/models', modelsRoutes);
  app.use('/api/usage-logs', usageRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/upload', uploadRoutes);
  if (env.METRICS_ENABLED) {
    app.use('/api/metrics', metricsRoutes);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
