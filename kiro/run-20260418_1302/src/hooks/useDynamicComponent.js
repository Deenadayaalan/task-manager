import { useState, useEffect, useCallback } from 'react';
import { microfrontendLoader } from '../utils/microfrontendLoader';

export const useDynamicComponent = (remoteName, componentName, options = {}) => {
  const [Component, setComponent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { 
    fallback = null, 
    preload = false,
    retryCount = 3,
    retryDelay = 1000 
  } = options;

  const loadComponent = useCallback(async (attempt = 1) => {
    try {
      setLoading(true);
      setError(null);

      const loadedComponent = await microfrontendLoader.loadComponent(
        remoteName, 
        componentName
      );
      
      setComponent(() => loadedComponent);
    } catch (err) {
      console.error(`Failed to load ${remoteName}/${componentName} (attempt ${attempt}):`, err);
      
      if (attempt < retryCount) {
        setTimeout(() => {
          loadComponent(attempt + 1);
        }, retryDelay * attempt);
      } else {
        setError(err);
        if (fallback) {
          setComponent(() => fallback);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [remoteName, componentName, fallback, retryCount, retryDelay]);

  useEffect(() => {
    if (preload) {
      microfrontendLoader.preloadComponent(remoteName, componentName);
    }
  }, [remoteName, componentName, preload]);

  useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  const retry = useCallback(() => {
    loadComponent();
  }, [loadComponent]);

  return {
    Component,
    loading,
    error,
    retry
  };
};