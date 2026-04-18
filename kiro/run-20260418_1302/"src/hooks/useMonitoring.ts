import { useEffect, useCallback, useRef } from 'react';
import { LoggingService, PerformanceMonitor } from '../services/logging.service';

export const useMonitoring = () => {
  const logger = LoggingService.getInstance();
  const performanceMonitor = PerformanceMonitor.getInstance();

  const logError = useCallback((error: Error, context?: string) => {
    logger.error(`Error in ${context || 'component'}`, error);
  }, [logger]);

  const logInfo = useCallback((message: string, metadata?: Record<string, any>) => {
    logger.info(message, metadata);
  }, [logger]);

  const measurePerformance = useCallback((name: string) => {
    return performanceMonitor.startTimer(name);
  }, [performanceMonitor]);

  return {
    logError,
    logInfo,
    measurePerformance
  };
};

export const useErrorBoundary = () => {
  const { logError } = useMonitoring();

  const handleError = useCallback((error: Error, errorInfo: any) => {
    logError(error, 'ErrorBoundary');
    
    // You could also send to external error tracking service
    console.error('Error caught by boundary:', error, errorInfo);
  }, [logError]);

  return { handleError };
};

export const usePageTracking = (pageName: string) => {
  const { logInfo, measurePerformance } = useMonitoring();
  const startTimeRef = useRef<number>();

  useEffect(() => {
    startTimeRef.current = performance.now();
    
    logInfo('Page view', {
      page: pageName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });

    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        logInfo('Page session ended', {
          page: pageName,
          duration: Math.round(duration),
          unit: 'ms'
        });
      }
    };
  }, [pageName, logInfo]);
};

export const useApiMonitoring = () => {
  const { logError, logInfo, measurePerformance } = useMonitoring();

  const monitorApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    endpoint: string
  ): Promise<T> => {
    const stopTimer = measurePerformance(`api_call_${endpoint}`);
    const startTime = Date.now();

    try {
      logInfo('API call started', { endpoint });
      
      const result = await apiCall();
      
      const duration = Date.now() - startTime;
      logInfo('API call successful', {
        endpoint,
        duration,
        status: 'success'
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logError(error as Error, `API call failed: ${endpoint}`);
      
      logInfo('API call failed', {
        endpoint,
        duration,
        status: 'error',
        error: (error as Error).message
      });

      throw error;
    } finally {
      stopTimer();
    }
  }, [logError, logInfo, measurePerformance]);

  return { monitorApiCall };
};