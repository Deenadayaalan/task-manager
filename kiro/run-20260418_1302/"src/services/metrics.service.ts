import { CloudWatch } from 'aws-sdk';

export interface MetricData {
  metricName: string;
  namespace: string;
  value: number;
  unit: string;
  dimensions?: Record<string, string>;
  timestamp?: Date;
}

export class MetricsService {
  private cloudWatch: CloudWatch;
  private namespace: string;

  constructor() {
    this.cloudWatch = new CloudWatch({
      region: process.env.REACT_APP_AWS_REGION
    });
    this.namespace = process.env.REACT_APP_METRICS_NAMESPACE || 'TaskManager/Application';
  }

  async putMetric(metric: Omit<MetricData, 'namespace'>): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Metric:', { ...metric, namespace: this.namespace });
      return;
    }

    try {
      const params: CloudWatch.PutMetricDataInput = {
        Namespace: this.namespace,
        MetricData: [{
          MetricName: metric.metricName,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp || new Date(),
          Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined
        }]
      };

      await this.cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put metric to CloudWatch:', error);
    }
  }

  async putMetrics(metrics: Omit<MetricData, 'namespace'>[]): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log('Metrics:', metrics.map(m => ({ ...m, namespace: this.namespace })));
      return;
    }

    try {
      const params: CloudWatch.PutMetricDataInput = {
        Namespace: this.namespace,
        MetricData: metrics.map(metric => ({
          MetricName: metric.metricName,
          Value: metric.value,
          Unit: metric.unit,
          Timestamp: metric.timestamp || new Date(),
          Dimensions: metric.dimensions ? Object.entries(metric.dimensions).map(([Name, Value]) => ({ Name, Value })) : undefined
        }))
      };

      await this.cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to put metrics to CloudWatch:', error);
    }
  }

  // Application Performance Metrics
  async recordPageLoad(pageName: string, loadTime: number, userId?: string): Promise<void> {
    await this.putMetric({
      metricName: 'PageLoadTime',
      value: loadTime,
      unit: 'Milliseconds',
      dimensions: {
        PageName: pageName,
        ...(userId && { UserId: userId })
      }
    });
  }

  async recordApiCall(endpoint: string, duration: number, statusCode: number, userId?: string): Promise<void> {
    await this.putMetrics([
      {
        metricName: 'ApiCallDuration',
        value: duration,
        unit: 'Milliseconds',
        dimensions: {
          Endpoint: endpoint,
          StatusCode: statusCode.toString(),
          ...(userId && { UserId: userId })
        }
      },
      {
        metricName: 'ApiCallCount',
        value: 1,
        unit: 'Count',
        dimensions: {
          Endpoint: endpoint,
          StatusCode: statusCode.toString(),
          ...(userId && { UserId: userId })
        }
      }
    ]);
  }

  // Business Metrics
  async recordTaskCreated(userId: string, category?: string): Promise<void> {
    await this.putMetric({
      metricName: 'TasksCreated',
      value: 1,
      unit: 'Count',
      dimensions: {
        UserId: userId,
        ...(category && { Category: category })
      }
    });
  }

  async recordTaskCompleted(userId: string, completionTime: number, category?: string): Promise<void> {
    await this.putMetrics([
      {
        metricName: 'TasksCompleted',
        value: 1,
        unit: 'Count',
        dimensions: {
          UserId: userId,
          ...(category && { Category: category })
        }
      },
      {
        metricName: 'TaskCompletionTime',
        value: completionTime,
        unit: 'Seconds',
        dimensions: {
          UserId: userId,
          ...(category && { Category: category })
        }
      }
    ]);
  }

  async recordUserSession(userId: string, sessionDuration: number): Promise<void> {
    await this.putMetrics([
      {
        metricName: 'ActiveUsers',
        value: 1,
        unit: 'Count',
        dimensions: { UserId: userId }
      },
      {
        metricName: 'SessionDuration',
        value: sessionDuration,
        unit: 'Seconds',
        dimensions: { UserId: userId }
      }
    ]);
  }

  // Error Metrics
  async recordError(errorType: string, errorMessage: string, userId?: string): Promise<void> {
    await this.putMetric({
      metricName: 'ErrorCount',
      value: 1,
      unit: 'Count',
      dimensions: {
        ErrorType: errorType,
        ErrorMessage: errorMessage.substring(0, 100), // Limit dimension value length
        ...(userId && { UserId: userId })
      }
    });
  }
}

export const metricsService = new MetricsService();