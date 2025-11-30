import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { config } from './config';
import { databaseService } from './services/database.service';
import { blockchainService } from './services/blockchain.service';
import { logger } from './services/logger.service';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { requestLogger, securityHeaders, rateLimiter } from './middleware/security.middleware';

// Load environment variables
dotenv.config();

const app: Express = express();

// Security Middleware
app.use(securityHeaders);

// Rate Limiting (100 requests per 15 minutes per IP)
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 100 }));

// Request Logging
app.use(requestLogger);

// CORS
app.use(cors({
  origin: config.nodeEnv === 'production' 
    ? process.env.FRONTEND_URL 
    : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body Parsing
app.use(express.json({ limit: '10kb' })); // Limit body size

// Routes
app.use('/', routes);

// 404 Handler
app.use(notFoundHandler);

// Global Error Handler
app.use(errorHandler);

// Graceful shutdown handler
const gracefulShutdown = async () => {
  console.log('\n🛑 Shutting down gracefully...');
  await databaseService.disconnect();
  process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start server with database and blockchain connection
const startServer = async () => {
  try {
    // Connect to database
    await databaseService.connect();

    // Initialize blockchain connection
    try {
      await blockchainService.initialize();
    } catch (error) {
      console.warn('⚠️  Blockchain connection failed. Some features may be unavailable.');
    }

    // Start Express server
    app.listen(config.port, () => {
      console.log(`🚀 Backend server running on http://localhost:${config.port}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
