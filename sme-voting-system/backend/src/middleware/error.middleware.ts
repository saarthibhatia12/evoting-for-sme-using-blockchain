import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';

/**
 * Custom Error Classes
 */

/**
 * Base application error
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  public details?: any[];

  constructor(message: string, details?: any[]) {
    super(message, 400);
    this.details = details;
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

/**
 * Conflict error (409) - for duplicate registrations
 */
export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

/**
 * Blockchain error (502)
 */
export class BlockchainError extends AppError {
  public txHash?: string;

  constructor(message: string, txHash?: string) {
    super(message, 502);
    this.txHash = txHash;
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429);
  }
}

/**
 * Error response interface
 */
interface ErrorResponse {
  success: false;
  error: string;
  statusCode: number;
  details?: any[];
  stack?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = 'Internal server error';
  let details: any[] | undefined;

  // Handle known operational errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    
    if (err instanceof ValidationError && err.details) {
      details = err.details;
    }
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    if (prismaError.code === 'P2002') {
      statusCode = 409;
      message = 'A record with this value already exists';
      
      // Extract the field that caused the unique constraint violation
      const field = prismaError.meta?.target?.[0];
      if (field) {
        message = `A record with this ${field} already exists`;
      }
    } else if (prismaError.code === 'P2025') {
      statusCode = 404;
      message = 'Record not found';
    }
  }

  // Handle JSON parsing errors
  if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    message = 'Invalid JSON in request body';
  }

  // Log the error
  logger.error('ERROR', message, {
    statusCode,
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Build error response
  const errorResponse: ErrorResponse = {
    success: false,
    error: message,
    statusCode,
  };

  if (details) {
    errorResponse.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Not found handler for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    statusCode: 404,
  });
};

/**
 * Async handler wrapper to catch errors in async functions
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
