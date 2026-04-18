// src/hooks/useAnalytics.ts
import { useState, useEffect, useCallback } from 'react';
import { analyticsService } from '../services/analyticsService';
import {
  AnalyticsData,
  AnalyticsFilter,
  DateRange,
  TaskMetrics,
  ProductivityData,
  PerformanceData,
  TimeTrackingData
} from '../types/analytics';

interface UseAnalyticsProps {
  userId?: string;
  projectId?: string;
  dateRange: DateRange;
  filters: AnalyticsFilter;
}

interface UseAnalyticsReturn {
  taskMetrics: TaskMetrics | null;
  productivityData: ProductivityData | null;
  performanceData: PerformanceData | null;
  timeTrackingData: TimeTrackingData | null;
  loading: boolean;
  error: string | null;
  exportReport: (format: 'pdf' | 'excel' | 'csv') => Promise<void>;
  refreshData: () => Promise<void>;
}

export const useAnalytics = ({
  userId,
  projectId,
  dateRange,
  filters
}: UseAnalyticsProps): UseAnalyticsReturn => {
  const [taskMetrics, setTaskMetrics] = useState<TaskMetrics | null>(null);
  const [productivityData, setProductivityData] = useState<ProductivityData | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [timeTrackingData, setTimeTrackingData] = useState<TimeTrackingData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        taskMetricsData,
        productivityAnalysis,
        performanceAnalysis,
        timeTrackingAnalysis
      ] = await Promise.all([
        analyticsService.getTaskMetrics({ userId, projectId, dateRange, filters }),
        analyticsService.getProductivityData({ userId, projectId, dateRange, filters }),
        analyticsService.getPerformanceData({ userId, projectId, dateRange, filters }),
        analyticsService.getTimeTrackingData({ userId, projectId, dateRange, filters })
      ]);

      setTaskMetrics(taskMetricsData);
      setProductivityData(productivityAnalysis);
      setPerformanceData(performanceAnalysis);
      setTimeTrackingData(timeTrackingAnalysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
    } finally {
      setLoading(false);
    }
  }, [userId, projectId, dateRange, filters]);

  const exportReport = useCallback(async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      await analyticsService.exportReport({
        format,
        userId,
        projectId,
        dateRange,
        filters,
        data: {
          taskMetrics,
          productivityData,
          performanceData,
          timeTrackingData
        }
      });
    } catch (err) {
      throw new Error(`Failed to export report: ${err}`);
    }
  }, [userId, projectId, dateRange, filters, taskMetrics, productivityData, performanceData, timeTrackingData]);

  const refreshData = useCallback(async () => {
    await fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  return {
    taskMetrics,
    productivityData,
    performanceData,
    timeTrackingData,
    loading,
    error,
    exportReport,
    refreshData
  };
};