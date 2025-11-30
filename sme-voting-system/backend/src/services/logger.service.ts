import fs from 'fs';
import path from 'path';

/**
 * Logger Service
 * Handles logging for blockchain interactions and application events
 */

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: any;
}

class LoggerService {
  private logDir: string;
  private logToFile: boolean;
  private logToConsole: boolean;

  constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.logToFile = process.env.NODE_ENV === 'production';
    this.logToConsole = true;

    // Create logs directory if it doesn't exist
    if (this.logToFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format log entry for output
   */
  private formatLogEntry(entry: LogEntry): string {
    const dataStr = entry.data ? ` | Data: ${JSON.stringify(entry.data)}` : '';
    return `[${entry.timestamp}] [${entry.level}] [${entry.category}] ${entry.message}${dataStr}`;
  }

  /**
   * Write log entry to file
   */
  private writeToFile(entry: LogEntry): void {
    if (!this.logToFile) return;

    const date = new Date().toISOString().split('T')[0];
    const filename = path.join(this.logDir, `${date}.log`);
    const logLine = this.formatLogEntry(entry) + '\n';

    fs.appendFileSync(filename, logLine);
  }

  /**
   * Write log entry to console
   */
  private writeToConsole(entry: LogEntry): void {
    if (!this.logToConsole) return;

    const formattedEntry = this.formatLogEntry(entry);

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(formattedEntry);
        break;
      case LogLevel.WARN:
        console.warn(formattedEntry);
        break;
      case LogLevel.DEBUG:
        if (process.env.NODE_ENV === 'development') {
          console.debug(formattedEntry);
        }
        break;
      default:
        console.log(formattedEntry);
    }
  }

  /**
   * Create and write a log entry
   */
  private log(level: LogLevel, category: string, message: string, data?: any): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
    };

    this.writeToConsole(entry);
    this.writeToFile(entry);
  }

  // General logging methods
  debug(category: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  info(category: string, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  warn(category: string, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  error(category: string, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data);
  }

  // ============ Blockchain-specific logging methods ============

  /**
   * Log blockchain transaction initiated
   */
  blockchainTxInitiated(operation: string, params: any): void {
    this.info('BLOCKCHAIN', `Transaction initiated: ${operation}`, {
      operation,
      params,
    });
  }

  /**
   * Log blockchain transaction success
   */
  blockchainTxSuccess(operation: string, txHash: string, params?: any): void {
    this.info('BLOCKCHAIN', `Transaction successful: ${operation}`, {
      operation,
      txHash,
      params,
    });
  }

  /**
   * Log blockchain transaction failure
   */
  blockchainTxFailed(operation: string, error: string, params?: any): void {
    this.error('BLOCKCHAIN', `Transaction failed: ${operation}`, {
      operation,
      error,
      params,
    });
  }

  /**
   * Log blockchain read operation
   */
  blockchainRead(operation: string, result: any): void {
    this.debug('BLOCKCHAIN', `Read operation: ${operation}`, {
      operation,
      result,
    });
  }

  // ============ Auth-specific logging methods ============

  /**
   * Log authentication attempt
   */
  authAttempt(walletAddress: string): void {
    this.info('AUTH', `Authentication attempt`, {
      walletAddress: this.maskAddress(walletAddress),
    });
  }

  /**
   * Log authentication success
   */
  authSuccess(walletAddress: string): void {
    this.info('AUTH', `Authentication successful`, {
      walletAddress: this.maskAddress(walletAddress),
    });
  }

  /**
   * Log authentication failure
   */
  authFailed(walletAddress: string, reason: string): void {
    this.warn('AUTH', `Authentication failed: ${reason}`, {
      walletAddress: this.maskAddress(walletAddress),
    });
  }

  // ============ Voting-specific logging methods ============

  /**
   * Log vote cast
   */
  voteCast(
    shareholderAddress: string,
    proposalId: number,
    voteChoice: boolean,
    txHash?: string
  ): void {
    this.info('VOTING', `Vote cast`, {
      shareholder: this.maskAddress(shareholderAddress),
      proposalId,
      voteChoice: voteChoice ? 'YES' : 'NO',
      txHash,
    });
  }

  /**
   * Log vote attempt failed
   */
  voteFailed(
    shareholderAddress: string,
    proposalId: number,
    reason: string
  ): void {
    this.warn('VOTING', `Vote failed: ${reason}`, {
      shareholder: this.maskAddress(shareholderAddress),
      proposalId,
    });
  }

  // ============ Proposal-specific logging methods ============

  /**
   * Log proposal created
   */
  proposalCreated(proposalId: number, title: string, txHash?: string): void {
    this.info('PROPOSAL', `Proposal created`, {
      proposalId,
      title,
      txHash,
    });
  }

  // ============ Shareholder-specific logging methods ============

  /**
   * Log shareholder registered
   */
  shareholderRegistered(
    walletAddress: string,
    name: string,
    shares: number,
    txHash?: string
  ): void {
    this.info('SHAREHOLDER', `Shareholder registered`, {
      walletAddress: this.maskAddress(walletAddress),
      name,
      shares,
      txHash,
    });
  }

  // ============ Utility methods ============

  /**
   * Mask wallet address for privacy (show first 6 and last 4 chars)
   */
  private maskAddress(address: string): string {
    if (!address || address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Log API request
   */
  apiRequest(method: string, path: string, statusCode: number, duration: number): void {
    const level = statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    this.log(level, 'API', `${method} ${path} - ${statusCode} (${duration}ms)`, {
      method,
      path,
      statusCode,
      duration,
    });
  }
}

export const logger = new LoggerService();
