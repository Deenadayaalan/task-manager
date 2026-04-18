// src/components/admin/PerformanceDashboard.tsx
import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../utils/performance';
import { memoryManager } from '../../utils/memoryManager';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export const PerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [memoryStats, setMemoryStats] = useState<any>({});

  useEffect(() => {
    const updateMetrics = () => {
      const taskListMetrics = performanceMonitor.getMetrics('task_list_render');
      const imageLoadMetrics = performanceMonitor.getMetrics('image_load');
      const cacheStats = memoryManager.getStats();

      setMetrics([
        {
          name: 'Task List Render Time',
          value: taskListMetrics.avg,
          unit: 'ms',
          trend: taskListMetrics.avg < 100 ? 'down' : 'up'
        },
        {
          name: 'Image Load Time',
          value: imageLoadMetrics.avg,
          unit: 'ms',
          trend: imageLoadMetrics.avg < 500 ? 'down' : 'up'
        },
        {
          name: 'Cache Hit Rate',
          value: cacheStats.hitRate,
          unit: '%',
          trend: cacheStats.hitRate > 80 ? 'up' : 'down'
        }
      ]);

      setMemoryStats(cacheStats);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  const getWebVitals = () => {
    if ('web-vitals' in window) {
      return {
        fcp: performance.getEntriesByType('paint')[0]?.startTime || 0,
        lcp: 0, // Would be measured by web-vitals library
        fid: 0, // Would be measured by web-vitals library
        cls: 0  // Would be measured by web-vitals library
      };
    }
    return null;
  };

  return (
    <div className="performance-dashboard">
      <h2>Performance Dashboard</h2>
      
      <div className="metrics-grid">
        {metrics.map((metric) => (
          <div key={metric.name} className="metric-card">
            <h3>{metric.name}</h3>
            <div className="metric-value">
              <span className="value">{metric.value.toFixed(2)}</span>
              <span className="unit">{metric.unit}</span>
              <span className={`trend ${metric.trend}`}>
                {metric.trend === 'up' ? '↑' : metric.trend === 'down' ? '↓' : '→'}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="memory-stats">
        <h3>Memory Usage</h3>
        <div className="stats-grid">
          <div className="stat">
            <label>Cache Size:</label>
            <span>{memoryStats.size}/{memoryStats.maxSize}</span>
          </div>
          <div className="stat">
            <label>Hit Rate:</label>
            <span>{memoryStats.hitRate?.toFixed(2)}%</span>
          </div>
        </div>
      </div>

      <div className="web-vitals">
        <h3>Core Web Vitals</h3>
        <div className="vitals-grid">
          <div className="vital">
            <label>First Contentful Paint:</label>
            <span>{getWebVitals()?.fcp.toFixed(2)}ms</span>
          </div>
          <div className="vital">
            <label>Largest Contentful Paint:</label>
            <span>{getWebVitals()?.lcp.toFixed(2)}ms</span>
          </div>
          <div className="vital">
            <label>First Input Delay:</label>
            <span>{getWebVitals()?.fid.toFixed(2)}ms</span>
          </div>
          <div className="vital">
            <label>Cumulative Layout Shift:</label>
            <span>{getWebVitals()?.cls.toFixed(3)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};