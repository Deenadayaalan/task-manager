// src/utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTiming(label: string): string {
    const id = `${label}_${Date.now()}_${Math.random()}`;
    performance.mark(`${id}_start`);
    return id;
  }

  endTiming(id: string): number {
    const endMark = `${id}_end`;
    performance.mark(endMark);
    
    const startMark = `${id}_start`;
    performance.measure(id, startMark, endMark);
    
    const measure = performance.getEntriesByName(id)[0];
    const duration = measure.duration;
    
    const label = id.split('_')[0];
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    this.metrics.get(label)!.push(duration);
    
    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(id);
    
    return duration;
  }

  getMetrics(label: string): { avg: number; min: number; max: number; count: number } {
    const values = this.metrics.get(label) || [];
    if (values.length === 0) {
      return { avg: 0, min: 0, max: 0, count: 0 };
    }

    return {
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      count: values.length
    };
  }

  reportToCloudWatch(metricName: string, value: number, unit: string = 'Milliseconds') {
    // Send to CloudWatch
    if (window.AWS && window.AWS.CloudWatch) {
      const cloudwatch = new window.AWS.CloudWatch();
      cloudwatch.putMetricData({
        Namespace: 'TaskManager/Performance',
        MetricData: [{
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date()
        }]
      }).promise().catch(console.error);
    }
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance();

// React Hook for performance monitoring
export function usePerformanceMonitor() {
  const startTiming = (label: string) => performanceMonitor.startTiming(label);
  const endTiming = (id: string) => {
    const duration = performanceMonitor.endTiming(id);
    performanceMonitor.reportToCloudWatch(id.split('_')[0], duration);
    return duration;
  };

  return { startTiming, endTiming, getMetrics: performanceMonitor.getMetrics.bind(performanceMonitor) };
}