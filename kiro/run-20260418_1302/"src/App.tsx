import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LoggingService } from './services/logging.service';
import { useMonitoring, usePageTracking } from './hooks/useMonitoring';
import { getMonitoringConfig } from './config/monitoring.config';

// Import your components
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import TaskForm from './components/TaskForm';
import TaskDetail from './components/TaskDetail';

const App: React.FC = () => {
  const { logInfo } = useMonitoring();
  
  useEffect(() => {
    // Initialize monitoring
    const config = getMonitoringConfig();
    const logger = LoggingService.getInstance();
    
    logger.info('Application started', {
      environment: process.env.NODE_ENV,
      version: process.env.REACT_APP_VERSION,
      config: {
        logLevel: config.logLevel,
        performanceMonitoring: config.enablePerformanceMonitoring
      }
    });

    // Track application load time
    if (window.performance) {
      const loadTime = window.performance.timing.loadEventEnd - 
                      window.performance.timing.navigationStart;
      
      logger.info('Application load time', {
        loadTime,
        unit: 'ms'
      });
    }
  }, [logInfo]);

  return (
    <ErrorBoundary>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/" element={<MonitoredDashboard />} />
            <Route path="/tasks" element={<MonitoredTaskList />} />
            <Route path="/tasks/new" element={<MonitoredTaskForm />} />
            <Route path="/tasks/:id" element={<MonitoredTaskDetail />} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
};

// Wrapped components with monitoring
const MonitoredDashboard = () => {
  usePageTracking('Dashboard');
  return <Dashboard />;
};

const MonitoredTaskList = () => {
  usePageTracking('TaskList');
  return <TaskList />;
};

const MonitoredTaskForm = () => {
  usePageTracking('TaskForm');
  return <TaskForm />;
};

const MonitoredTaskDetail = () => {
  usePageTracking('TaskDetail');
  return <TaskDetail />;
};

export default App;