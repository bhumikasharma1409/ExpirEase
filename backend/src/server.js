import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { connectDatabase } from './config/db.js';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware.js';
import authRouter from './routes/authRoutes.js';
import dashboardRouter from './routes/dashboardRoutes.js';
import notificationRouter from './routes/notificationRoutes.js';
import productRouter from './routes/productRoutes.js';
import { startReminderScheduler } from './services/reminderScheduler.js';

function validateEnvironment() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters in backend/.env.');
  }
  const port = Number(process.env.PORT || 5000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port between 1 and 65535.');
  }
  if (!process.env.CLIENT_URL) {
    throw new Error('CLIENT_URL must be configured in backend/.env.');
  }
  return port;
}

async function startServer() {
  const port = validateEnvironment();
  await connectDatabase();

  const app = express();
  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || origin === process.env.CLIENT_URL) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS.'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    const connected = mongoose.connection.readyState === 1;
    return res.status(connected ? 200 : 503).json({
      success: connected,
      data: {
        status: connected ? 'ok' : 'unavailable',
        database: connected ? 'connected' : 'disconnected',
      },
    });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/products', productRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/notifications', notificationRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);

  startReminderScheduler();
  const server = app.listen(port, () => {
    console.info(`ExpirEase API listening on port ${port}.`);
  });

  const shutdown = (signal) => {
    console.info(`${signal} received. Closing HTTP and MongoDB connections.`);
    server.close(() => {
      mongoose.disconnect()
        .then(() => process.exit(0))
        .catch((error) => {
          console.error('Error closing MongoDB connection:', error.message);
          process.exit(1);
        });
    });
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((error) => {
  console.error(`Backend startup failed: ${error.message}`);
  process.exitCode = 1;
});
