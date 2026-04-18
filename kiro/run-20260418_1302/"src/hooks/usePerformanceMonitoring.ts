import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { metricsService } from '../services/metrics.service';
import { loggingService } from '../services/logging.service';

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
}

export const usePerformanceMonitoring = () => {
  const { user } = useAuth();
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const pageLoadStartRef = useRef<number>(Date.now());

  // Record page load performance
  const recordPageLoad = useCallback((pageName: string) => {
    const loadTime = Date.now() - pageLoadStartRef.current;
    
    metricsService.recordPageLoad(pageName, loadTime, user?.id);
    loggingService.info('Page loaded', {
      pageName,
      loadTime,
      userId: user?.id
    });
  }, [user?.id]);

  // Record API call performance
  const recordApiCall = useCallback(async (
    endpoint: string,
    method: string,
    startTime: number,
    statusCode: number,
    error?: Error
  ) => {
    const duration = Date.now() - startTime;
    
    await metricsService.recordApiCall(endpoint, duration, statusCode, user?.id);
    
    if (error) {
      await loggingService.error('API call failed', {
        endpoint,
        method,
        duration,
        statusCode,
        error: error.message,
        userId: user?.id
      });
      
      await metricsService.recordError('API_ERROR', error.message, user?.id);
    } else {
      await loggingService.info('API call completed', {
        endpoint,
        method,
        duration,
        statusCode,
        userId: user?.id
      });
    }
  }, [user?.id]);

  // Record component render performance
  const recordComponentRender = useCallback((componentName: string, renderTime: number) => {
    metricsService.putMetric({
      metricName: 'ComponentRenderTime',
      value: renderTime,
      unit: 'Milliseconds',
      dimensions: {
        ComponentName: componentName,
        ...(user?.id && { UserId: user.id })
      }
    });
  }, [user?.id]);

  // Record user interaction
  const recordUserInteraction = useCallback((action: string, target: string) => {
    metricsService.putMetric({
      metricName: 'UserInteractions',
      value: 1,
      unit: 'Count',
      dimensions: {
        Action: action,
        Target: target,
        ...(user?.id && { UserId: user.id })
      }
    });

    loggingService.info('User interaction', {
      action,
      target,
      userId: user?.id
    });
  }, [user?.id]);

  // Setup performance observer
  useEffect(() => {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        
        entries.forEach((entry: PerformanceEntry) => {
          if (entry.name.includes('navigation')) {
            metricsService.putMetric({
              metricName: 'NavigationTiming',
              value: entry.duration,
              unit: 'Milliseconds',
              dimensions: {
                NavigationType: entry.name,
                ...(user?.id && { UserId: user.id })
              }
            });
          }
        });
      });

      performanceObserverRef.current.observe({ 
        entryTypes: ['navigation', 'measure', 'resource'] 
      });
    }

    return () => {
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, [user?.id]);

  // Record session start
  useEffect(() => {
    if (user?.id) {
      const sessionStart = Date.now();
      
      loggingService.logUserLogin(user.id);
      
      return () => {
        const sessionDuration = (Date.now() - sessionStart) / 1000;
        metricsService.recordUserSession(user.id, sessionDuration);
        loggingService.logUserLogout(user.id);
      };
    }
  }, [user?.id]);

  return {
    recordPageLoad,
    recordApiCall,
    recordComponentRender,
    recordUserInteraction
  };
};