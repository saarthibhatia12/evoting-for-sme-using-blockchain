import express, { Express } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes';
import { config } from './config';
import { databaseService } from './services/database.service';
import { blockchainService } from './services/blockchain.service';

// Load environment variables
dotenv.config();

const app: Express = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/', routes);

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
