import { Request, Response } from 'express';
import { databaseService } from '../services/database.service';
import { blockchainService } from '../services/blockchain.service';

/**
 * Health check controller
 * Returns the current status of the API, database, and blockchain
 */
export const healthCheck = async (req: Request, res: Response): Promise<void> => {
  const dbHealthy = await databaseService.healthCheck();
  const blockchainConnected = await blockchainService.isConnected();
  
  const allHealthy = dbHealthy && blockchainConnected;
  
  res.json({
    status: allHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbHealthy ? 'connected' : 'disconnected',
      blockchain: blockchainConnected ? 'connected' : 'disconnected',
    },
  });
};

/**
 * Root endpoint controller
 * Returns API information
 */
export const rootInfo = (req: Request, res: Response): void => {
  res.json({
    message: 'SME Voting System API',
    status: 'running',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      shareholders: 'GET /shareholders, POST /shareholders/register',
      proposals: 'GET /proposals, POST /proposals/create, GET /proposals/:id',
      voting: 'POST /vote, GET /results/:proposalId',
      auth: 'POST /auth/nonce, POST /auth/verify',
    },
  });
};
