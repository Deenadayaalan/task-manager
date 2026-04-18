// src/hooks/usePerformance.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { performanceMonitor } from '../utils/performance';

export const usePerformance = (componentName: string) => {
  const renderCount = useRef(0);
  const [isOptimized, setIsOptimized] = useState(false);

  useEffect(() => {
    renderCount.current += 1;
    
    // Track excessive re-renders
    if (renderCount.current > 10) {
      console.warn(`${componentName} has rendered ${renderCount.current} times`);
    }
  });

  const measureAsync = useCallback(async (
    operation: () => Promise<any>,
    operationName: string
  ) => {
    const start = performance.now();
    try {
      const result = await operation();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(componentName, 'interactionTime', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(componentName, 'interactionTime', duration);
      throw error;
    }
  }, [componentName]);

  const measureSync = useCallback((
    operation: () => any,
    operationName: string
  ) => {
    const start = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(componentName, 'interactionTime', duration);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      performanceMonitor.recordMetric(componentName, 'interactionTime', duration);
      throw error;
    }
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    measureAsync,
    measureSync,
    isOptimized,
    setIsOptimized
  };
};

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T => {
  const lastCall = useRef(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
};