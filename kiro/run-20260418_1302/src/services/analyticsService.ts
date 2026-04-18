// src/services/analyticsService.ts
import { API } from 'aws-amplify';
import {
  AnalyticsFilter,
  DateRange,
  TaskMetrics,
  ProductivityData,
  PerformanceData,
  TimeTrackingData,
  ExportRequest
} from '../types/analytics';

interface AnalyticsRequest {
  userId?: string;
  projectId?: string;
  dateRange: DateRange;
  filters: AnalyticsFilter;
}

class AnalyticsService {
  private apiName = 'taskManagerAPI';

  async getTaskMetrics(request: AnalyticsRequest): Promise<TaskMetrics> {
    try {
      const response = await API.get(this.apiName, '/analytics/tasks', {
        queryStringParameters: {
          userId: request.userId,
          projectId: request.projectId,
          startDate: request.dateRange.startDate.toISOString(),
          endDate: request.dateRange.endDate.toISOString(),
          ...request.filters
        }
      });

      return {
        totalTasks: response.totalTasks,
        completedTasks: response.completedTasks,
        pendingTasks: response.pendingTasks,
        overdueTasks: response.overdueTasks,
        completionRate: response.completionRate,
        taskGrowth: response.taskGrowth,
        completionGrowth: response.completionGrowth,
        avgCompletionTime: response.avgCompletionTime,
        timeImprovement: response.timeImprovement,
        completionTrend: response.completionTrend,
        statusDistribution: response.statusDistribution,
        priorityBreakdown: response.priorityBreakdown
      };
    } catch (error) {
      console.error('Error fetching task metrics:', error);
      throw new Error('Failed to fetch task metrics');
    }
  }

  async getProductivityData(request: AnalyticsRequest): Promise<ProductivityData> {
    try {
      const response = await API.get(this.apiName, '/analytics/productivity', {
        queryStringParameters: {
          userId: request.userId,
          projectId: request.projectId,
          startDate: request.dateRange.startDate.toISOString(),
          endDate: request.dateRange.endDate.toISOString(),
          ...request.filters
        }
      });

      return {
        score: response.score,
        scoreChange: response.scoreChange,
        dailyProductivity: response.dailyProductivity,
        weeklyTrends: response.weeklyTrends,
        focusTimeAnalysis: response.focusTimeAnalysis,
        distractionMetrics: response.distractionMetrics,
        peakHours: response.peakHours,
        burnoutRisk: response.burnoutRisk
      };
    } catch (error) {
      console.error('Error fetching productivity data:', error);
      throw new Error('Failed to fetch productivity data');
    }
  }

  async getPerformanceData(request: AnalyticsRequest): Promise<PerformanceData> {
    try {
      const response = await API.get(this.apiName, '/analytics/performance', {
        queryStringParameters: {
          userId: request.userId,
          projectId: request.projectId,
          startDate: request.dateRange.startDate.toISOString(),
          endDate: request.dateRange.endDate.toISOString(),
          ...request.filters
        }
      });

      return {
        priorityMetrics: response.priorityMetrics,
        velocityTrend: response.velocityTrend,
        qualityScore: response.qualityScore,
        estimationAccuracy: response.estimationAccuracy,
        teamComparison: response.teamComparison,
        bottleneckAnalysis: response.bottleneckAnalysis
      };
    } catch (error) {
      console.error('Error fetching performance data:', error);
      throw new Error('Failed to fetch performance data');
    }
  }

  async getTimeTrackingData(request: AnalyticsRequest): Promise<TimeTrackingData> {
    try {
      const response = await API.get(this.apiName, '/analytics/time-tracking', {
        queryStringParameters: {
          userId: request.userId,
          projectId: request.projectId,
          startDate: request.dateRange.startDate.toISOString(),
          endDate: request.dateRange.endDate.toISOString(),
          ...request.filters
        }
      });

      return {
        totalHours: response.totalHours,
        billableHours: response.billableHours,
        weeklyHours: response.weeklyHours,
        projectBreakdown: response.projectBreakdown,
        categoryAnalysis: response.categoryAnalysis,
        utilizationRate: response.utilizationRate,
        overtimeAnalysis: response.overtimeAnalysis
      };
    } catch (error) {
      console.error('Error fetching time tracking data:', error);
      throw new Error('Failed to fetch time tracking data');
    }
  }

  async exportReport(request: ExportRequest): Promise<void> {
    try {
      const response = await API.post(this.apiName, '/analytics/export', {
        body: request
      });

      // Handle file download
      const blob = new Blob([response.data], { 
        type: this.getContentType(request.format) 
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analytics-report-${Date.now()}.${request.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      throw new Error('Failed to export report');
    }
  }

  private getContentType(format: string): string {
    switch (format) {
      case 'pdf':
        return 'application/pdf';
      case 'excel':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv':
        return 'text/csv';
      default:
        return 'application/octet-stream';
    }
  }

  async getRealtimeMetrics(userId?: string): Promise<any> {
    try {
      const response = await API.get(this.apiName, '/analytics/realtime', {
        queryStringParameters: { userId }
      });
      return response;
    } catch (error) {
      console.error('Error fetching realtime metrics:', error);
      throw new Error('Failed to fetch realtime metrics');
    }
  }

  async saveCustomReport(reportConfig: any): Promise<void> {
    try {
      await API.post(this.apiName, '/analytics/custom-reports', {
        body: reportConfig
      });
    } catch (error) {
      console.error('Error saving custom report:', error);
      throw new Error('Failed to save custom report');
    }
  }
}

export const analyticsService = new AnalyticsService();