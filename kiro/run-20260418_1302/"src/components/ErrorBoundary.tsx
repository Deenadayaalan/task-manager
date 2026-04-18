import React, { Component, ErrorInfo, ReactNode } from 'react';
import { loggingService } from '../services/logging.service';
import { metricsService } from '../services/metrics.service';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to CloudWatch
    loggingService.error('React Error Boundary caught error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });

    // Record error metric
    metricsService.recordError('REACT_ERROR', error.message);

    // Report to external error tracking service if needed
    if (process.env.NODE_ENV === 'production') {
      this.reportErrorToService(error, errorInfo);
    }
  }

  private reportErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Integration with external error tracking services like Sentry
    console.error('Error reported to monitoring service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem' }}>
              <summary>Error Details (Development Only)</summary>
              <p><strong>Error:</strong> {this.state.error?.message}</p>
              <p><strong>Stack:</strong> {this.state.error?.stack}</p>
              <p><strong>Component Stack:</strong> {this.state.errorInfo?.componentStack}</p>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}