// src/services/backup/DatabaseBackupService.ts
import { DynamoDBClient, CreateBackupCommand, ListBackupsCommand, DescribeBackupCommand } from '@aws-sdk/client-dynamodb';
import { BackupClient, StartBackupJobCommand, ListBackupJobsCommand, DescribeBackupJobCommand } from '@aws-sdk/client-backup';
import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

export interface BackupConfig {
  tableName: string;
  backupVaultName: string;
  s3BucketName: string;
  retentionDays: number;
  crossRegionReplication: boolean;
}

export interface BackupJob {
  id: string;
  status: 'CREATED' | 'PENDING' | 'RUNNING' | 'COMPLETED' | 'ABORTED' | 'FAILED';
  createdAt: Date;
  completedAt?: Date;
  resourceArn: string;
  backupVaultName: string;
  recoveryPointArn?: string;
}

export interface BackupMetrics {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  lastBackupTime: Date;
  backupSizeBytes: number;
}

export class DatabaseBackupService {
  private dynamoClient: DynamoDBClient;
  private backupClient: BackupClient;
  private s3Client: S3Client;
  private cloudWatchClient: CloudWatchClient;

  constructor(region: string = 'us-east-1') {
    this.dynamoClient = new DynamoDBClient({ region });
    this.backupClient = new BackupClient({ region });
    this.s3Client = new S3Client({ region });
    this.cloudWatchClient = new CloudWatchClient({ region });
  }

  async createDynamoDBBackup(tableName: string, backupName?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalBackupName = backupName || `${tableName}-backup-${timestamp}`;

      const command = new CreateBackupCommand({
        TableName: tableName,
        BackupName: finalBackupName
      });

      const response = await this.dynamoClient.send(command);
      
      await this.publishMetric('BackupCreated', 1, 'Count');
      
      return response.BackupDetails?.BackupArn || '';
    } catch (error) {
      console.error('Failed to create DynamoDB backup:', error);
      await this.publishMetric('BackupFailed', 1, 'Count');
      throw error;
    }
  }

  async startAWSBackupJob(config: BackupConfig): Promise<string> {
    try {
      const resourceArn = `arn:aws:dynamodb:${process.env.AWS_REGION}:${process.env.AWS_ACCOUNT_ID}:table/${config.tableName}`;
      
      const command = new StartBackupJobCommand({
        BackupVaultName: config.backupVaultName,
        ResourceArn: resourceArn,
        IamRoleArn: process.env.BACKUP_ROLE_ARN,
        IdempotencyToken: `backup-${config.tableName}-${Date.now()}`,
        StartWindowMinutes: 60,
        CompleteWindowMinutes: 120,
        Lifecycle: {
          DeleteAfterDays: config.retentionDays,
          MoveToColdStorageAfterDays: Math.min(7, config.retentionDays - 1)
        }
      });

      const response = await this.backupClient.send(command);
      
      await this.publishMetric('AWSBackupJobStarted', 1, 'Count');
      
      return response.BackupJobId || '';
    } catch (error) {
      console.error('Failed to start AWS Backup job:', error);
      await this.publishMetric('AWSBackupJobFailed', 1, 'Count');
      throw error;
    }
  }

  async listBackupJobs(backupVaultName: string, maxResults: number = 100): Promise<BackupJob[]> {
    try {
      const command = new ListBackupJobsCommand({
        ByBackupVaultName: backupVaultName,
        MaxResults: maxResults
      });

      const response = await this.backupClient.send(command);
      
      return (response.BackupJobs || []).map(job => ({
        id: job.BackupJobId || '',
        status: job.State as BackupJob['status'],
        createdAt: job.CreationDate || new Date(),
        completedAt: job.CompletionDate,
        resourceArn: job.ResourceArn || '',
        backupVaultName: job.BackupVaultName || '',
        recoveryPointArn: job.RecoveryPointArn
      }));
    } catch (error) {
      console.error('Failed to list backup jobs:', error);
      throw error;
    }
  }

  async getBackupJobStatus(backupJobId: string): Promise<BackupJob | null> {
    try {
      const command = new DescribeBackupJobCommand({
        BackupJobId: backupJobId
      });

      const response = await this.backupClient.send(command);
      
      if (!response.BackupJobId) {
        return null;
      }

      return {
        id: response.BackupJobId,
        status: response.State as BackupJob['status'],
        createdAt: response.CreationDate || new Date(),
        completedAt: response.CompletionDate,
        resourceArn: response.ResourceArn || '',
        backupVaultName: response.BackupVaultName || '',
        recoveryPointArn: response.RecoveryPointArn
      };
    } catch (error) {
      console.error('Failed to get backup job status:', error);
      throw error;
    }
  }

  async exportBackupToS3(tableName: string, s3BucketName: string, s3KeyPrefix: string): Promise<string> {
    try {
      // This would typically involve using DynamoDB Export to S3 feature
      const timestamp = new Date().toISOString();
      const exportKey = `${s3KeyPrefix}/${tableName}-export-${timestamp}.json`;

      // For demonstration, we'll create a metadata file
      const metadata = {
        tableName,
        exportTime: timestamp,
        status: 'INITIATED'
      };

      const command = new PutObjectCommand({
        Bucket: s3BucketName,
        Key: `${exportKey}-metadata.json`,
        Body: JSON.stringify(metadata, null, 2),
        ContentType: 'application/json'
      });

      await this.s3Client.send(command);
      
      await this.publishMetric('S3ExportInitiated', 1, 'Count');
      
      return exportKey;
    } catch (error) {
      console.error('Failed to export backup to S3:', error);
      await this.publishMetric('S3ExportFailed', 1, 'Count');
      throw error;
    }
  }

  async getBackupMetrics(backupVaultName: string): Promise<BackupMetrics> {
    try {
      const jobs = await this.listBackupJobs(backupVaultName);
      
      const totalBackups = jobs.length;
      const successfulBackups = jobs.filter(job => job.status === 'COMPLETED').length;
      const failedBackups = jobs.filter(job => job.status === 'FAILED').length;
      const lastBackupTime = jobs.length > 0 
        ? new Date(Math.max(...jobs.map(job => job.createdAt.getTime())))
        : new Date(0);

      // Calculate approximate backup size (this would need to be tracked separately in practice)
      const backupSizeBytes = successfulBackups * 1024 * 1024; // Placeholder calculation

      return {
        totalBackups,
        successfulBackups,
        failedBackups,
        lastBackupTime,
        backupSizeBytes
      };
    } catch (error) {
      console.error('Failed to get backup metrics:', error);
      throw error;
    }
  }

  async scheduleAutomatedBackup(config: BackupConfig, cronExpression: string): Promise<void> {
    try {
      // This would typically integrate with EventBridge for scheduling
      console.log(`Scheduling automated backup for ${config.tableName} with cron: ${cronExpression}`);
      
      // Store backup configuration for scheduled execution
      const configKey = `backup-configs/${config.tableName}.json`;
      
      const command = new PutObjectCommand({
        Bucket: config.s3BucketName,
        Key: configKey,
        Body: JSON.stringify({
          ...config,
          cronExpression,
          createdAt: new Date().toISOString()
        }, null, 2),
        ContentType: 'application/json'
      });

      await this.s3Client.send(command);
      
      await this.publishMetric('AutomatedBackupScheduled', 1, 'Count');
    } catch (error) {
      console.error('Failed to schedule automated backup:', error);
      throw error;
    }
  }

  private async publishMetric(metricName: string, value: number, unit: string): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'TaskManager/DisasterRecovery',
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date()
        }]
      });

      await this.cloudWatchClient.send(command);
    } catch (error) {
      console.error('Failed to publish metric:', error);
    }
  }
}