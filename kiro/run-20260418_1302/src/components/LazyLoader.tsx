// src/components/LazyLoader.tsx
import React, { Suspense, lazy, ComponentType } from 'react';
import { CircularProgress, Box } from '@mui/material';

interface LazyLoaderProps {
  fallback?: React.ReactNode;
  error?: React.ComponentType<{ error: Error; retry: () => void }>;
}

const DefaultFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

const DefaultErrorBoundary: React.ComponentType<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <Box textAlign="center" p={3}>
    <h3>Something went wrong</h3>
    <p>{error.message}</p>
    <button onClick={retry}>Retry</button>
  </Box>
);

export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options: LazyLoaderProps = {}
) => {
  const LazyComponent = lazy(importFunc);
  
  return React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const [error, setError] = React.useState<Error | null>(null);
    const [retryCount, setRetryCount] = React.useState(0);

    const retry = () => {
      setError(null);
      setRetryCount(prev => prev + 1);
    };

    if (error) {
      const ErrorComponent = options.error || DefaultErrorBoundary;
      return <ErrorComponent error={error} retry={retry} />;
    }

    return (
      <Suspense fallback={options.fallback || <DefaultFallback />}>
        <LazyComponent {...props} ref={ref} key={retryCount} />
      </Suspense>
    );
  });
};

// Error Boundary for lazy components
export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; retry: () => void }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorBoundary;
      return <FallbackComponent error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}