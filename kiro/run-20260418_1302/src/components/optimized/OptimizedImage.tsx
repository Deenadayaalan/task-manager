// src/components/optimized/OptimizedImage.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePerformanceMonitor } from '../../utils/performance';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  placeholder?: string;
  quality?: number;
  lazy?: boolean;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PC9zdmc+',
  quality = 80,
  lazy = true
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const { startTiming, endTiming } = usePerformanceMonitor();

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  // Optimize image URL
  const getOptimizedUrl = useCallback((url: string) => {
    if (url.includes('cloudfront') || url.includes('s3')) {
      const params = new URLSearchParams();
      if (width) params.append('w', width.toString());
      if (height) params.append('h', height.toString());
      params.append('q', quality.toString());
      params.append('f', 'webp');
      
      return `${url}?${params.toString()}`;
    }
    return url;
  }, [width, height, quality]);

  const handleLoad = useCallback(() => {
    const timingId = startTiming('image_load');
    setIsLoaded(true);
    endTiming(timingId);
  }, [startTiming, endTiming]);

  const handleError = useCallback(() => {
    setError(true);
  }, []);

  const optimizedSrc = getOptimizedUrl(src);

  return (
    <div className={`optimized-image-container ${className || ''}`}>
      <img
        ref={imgRef}
        src={isInView ? optimizedSrc : placeholder}
        alt={alt}
        width={width}
        height={height}
        className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
      />
      {!isLoaded && !error && (
        <div className="image-placeholder">
          <div className="loading-spinner" />
        </div>
      )}
      {error && (
        <div className="image-error">
          <span>Failed to load image</span>
        </div>
      )}
    </div>
  );
};