// src/utils/imageOptimization.ts
export interface ImageOptimizationOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png';
  lazy?: boolean;
}

export class ImageOptimizer {
  private static cache = new Map<string, string>();

  static async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<string> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080,
      format = 'webp'
    } = options;

    const cacheKey = `${file.name}-${quality}-${maxWidth}-${maxHeight}-${format}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        const mimeType = format === 'webp' ? 'image/webp' : 
                        format === 'jpeg' ? 'image/jpeg' : 'image/png';
        
        const optimizedDataUrl = canvas.toDataURL(mimeType, quality);
        
        this.cache.set(cacheKey, optimizedDataUrl);
        resolve(optimizedDataUrl);
      };

      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  static createLazyImage(src: string, alt: string, className?: string): HTMLImageElement {
    const img = document.createElement('img');
    img.alt = alt;
    img.className = className || '';
    img.loading = 'lazy';
    
    // Use Intersection Observer for better lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
    return img;
  }
}

// React component for optimized images
export const OptimizedImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  lazy?: boolean;
  optimization?: ImageOptimizationOptions;
}> = ({ src, alt, className, lazy = true, optimization = {} }) => {
  const [optimizedSrc, setOptimizedSrc] = React.useState<string>('');
  const [loading, setLoading] = React.useState(true);
  const imgRef = React.useRef<HTMLImageElement>(null);

  React.useEffect(() => {
    const loadImage = async () => {
      try {
        // For external URLs, use as-is
        if (src.startsWith('http')) {
          setOptimizedSrc(src);
          setLoading(false);
          return;
        }

        // For local files, optimize if needed
        const response = await fetch(src);
        const blob = await response.blob();
        const file = new File([blob], 'image');
        
        const optimized = await ImageOptimizer.optimizeImage(file, optimization);
        setOptimizedSrc(optimized);
        setLoading(false);
      } catch (error) {
        console.error('Image optimization failed:', error);
        setOptimizedSrc(src);
        setLoading(false);
      }
    };

    loadImage();
  }, [src, optimization]);

  if (loading) {
    return <div className={`${className} image-placeholder`}>Loading...</div>;
  }

  return (
    <img
      ref={imgRef}
      src={optimizedSrc}
      alt={alt}
      className={className}
      loading={lazy ? 'lazy' : 'eager'}
    />
  );
};