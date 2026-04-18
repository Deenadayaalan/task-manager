import { CloudWatchLogs } from 'aws-sdk';

export interface LogEntry {
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export class LoggingService {
  private cloudWatchLogs: CloudWatchLogs;
  private logGroupName: string;
  private logStreamName: string;

  constructor() {
    this.cloudWatchLogs = new CloudWatchLogs({
      region: process.env.REACT_APP_AWS_REGION
    });
    this.logGroupName = process.env.REACT_APP_LOG_GROUP_NAME || '/aws/lambda/task-manager-app';
    this.logStreamName = this.generateLogStreamName();
  }

  private generateLogStreamName(): string {
    const date = new Date().toISOString().split('T')[0];
    const sessionId = Math.random().toString(36).substring(7);
    return `${date}/${sessionId}`;
  }

  async log(entry: Omit<LogEntry, 'timestamp'>): Promise<void> {
    const logEntry: LogEntry = {
      ...entry,
      timestamp: new Date().toISOString()
    };

    // Log to console for development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${logEntry.level}] ${logEntry.message}`, logEntry.metadata);
      return;
    }

    try {
      await this.sendToCloudWatch(logEntry);
    } catch (error) {
      console.error('Failed to send log to CloudWatch:', error);
      // Fallback to console logging
      console.log(`[${logEntry.level}] ${logEntry.message}`, logEntry.metadata);
    }
  }

  private async sendToCloudWatch(entry: LogEntry): Promise<void> {
    const logEvent = {
      timestamp: Date.now(),
      message: JSON.stringify(entry)
    };

    try {
      await this.cloudWatchLogs.putLogEvents({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName,
        logEvents: [logEvent]
      }).promise();
    } catch (error) {
      if (error.code === 'ResourceNotFoundException') {
        await this.createLogStream();
        await this.cloudWatchLogs.putLogEvents({
          logGroupName: this.logGroupName,
          logStreamName: this.logStreamName,
          logEvents: [logEvent]
        }).promise();
      } else {
        throw error;
      }
    }
  }

  private async createLogStream(): Promise<void> {
    try {
      await this.cloudWatchLogs.createLogStream({
        logGroupName: this.logGroupName,
        logStreamName: this.logStreamName
      }).promise();
    } catch (error) {
      if (error.code !== 'ResourceAlreadyExistsException') {
        throw error;
      }
    }
  }

  info(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): Promise<void> {
    return this.log({ level: 'INFO', message, metadata, requestId, userId });
  }

  warn(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): Promise<void> {
    return this.log({ level: 'WARN', message, metadata, requestId, userId });
  }

  error(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): Promise<void> {
    return this.log({ level: 'ERROR', message, metadata, requestId, userId });
  }

  debug(message: string, metadata?: Record<string, any>, requestId?: string, userId?: string): Promise<void> {
    return this.log({ level: 'DEBUG', message, metadata, requestId, userId });
  }

  // Business event logging
  async logTaskCreated(taskId: string, userId: string, requestId?: string): Promise<void> {
    await this.log({
      level: 'INFO',
      message: 'TASK_CREATED',
      metadata: { taskId, userId },
      requestId,
      userId
    });
  }

  async logTaskUpdated(taskId: string, userId: string, changes: Record<string, any>, requestId?: string): Promise<void> {
    await this.log({
      level: 'INFO',
      message: 'TASK_UPDATED',
      metadata: { taskId, userId, changes },
      requestId,
      userId
    });
  }

  async logTaskDeleted(taskId: string, userId: string, requestId?: string): Promise<void> {
    await this.log({
      level: 'INFO',
      message: 'TASK_DELETED',
      metadata: { taskId, userId },
      requestId,
      userId
    });
  }

  async logUserLogin(userId: string, requestId?: string): Promise<void> {
    await this.log({
      level: 'INFO',
      message: 'USER_LOGIN',
      metadata: { userId },
      requestId,
      userId
    });
  }

  async logUserLogout(userId: string, requestId?: string): Promise<void> {
    await this.log({
      level: 'INFO',
      message: 'USER_LOGOUT',
      metadata: { userId },
      requestId,
      userId
    });
  }
}

export const loggingService = new LoggingService();