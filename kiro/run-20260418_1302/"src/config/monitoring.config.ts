export interface MonitoringConfig {
  logLevel: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableBusinessMetrics: boolean;
  cloudWatchEndpoint?: string;
  metricsEndpoint?: string;
  alertingEndpoint?: string;
  sampleRate: number;
}

export const getMonitoringConfig = (): MonitoringConfig => {
  const environment = process.env.NODE_ENV || 'development';
  
  const baseConfig: MonitoringConfig = {
    logLevel: 'INFO',
    enablePerformanceMonitoring: true,
    enableErrorTracking: true,
    enableBusinessMetrics: true,
    sampleRate: 1.0
  };

  switch (environment) {
    case 'development':
      return {
        ...baseConfig,
        logLevel: 'DEBUG',
        sampleRate: 1.0
      };
    
    case 'staging':
      return {
        ...baseConfig,
        logLevel: 'INFO',
        sampleRate: 0.5,
        cloudWatchEndpoint: process.env.REACT_APP_CLOUDWATCH_ENDPOINT,
        metricsEndpoint: process.env.REACT_APP_METRICS_ENDPOINT
      };
    
    case 'production':
      return {
        ...baseConfig,
        logLevel: 'WARN',
        sampleRate: 0.1,
        cloudWatchEndpoint: process.env.REACT_APP_CLOUDWATCH_ENDPOINT,
        metricsEndpoint: process.env.REACT_APP_METRICS_ENDPOINT,
        alertingEndpoint: process.env.REACT_APP_ALERTING_ENDPOINT
      };
    
    default:
      return baseConfig;
  }
};

export const MONITORING_EVENTS = {
  PAGE_VIEW: 'page_view',
  USER_ACTION: 'user_action',
  API_CALL: 'api_call',
  ERROR: 'error',
  PERFORMANCE: 'performance'
} as const;

export const BUSINESS_METRICS = {
  TASK_CREATED: 'task_created',
  TASK_COMPLETED: 'task_completed',
  TASK_DELETED: 'task_deleted',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  BOARD_CREATED: 'board_created'
} as const;