'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { ImageZoom } from './image-zoom';

interface NotionImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  loading?: 'eager' | 'lazy';
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  width?: number;
  height?: number;
  size?: 'thumbnail' | 'small' | 'medium' | 'large' | 'original';
  quality?: number;
  responsive?: boolean;
  enableZoom?: boolean;
}

export function NotionImage({ 
  src, 
  alt, 
  size = 'medium',
  quality = 85,
  responsive = false,
  enableZoom = false,
  ...props 
}: NotionImageProps) {
  const [imageError, setImageError] = useState(false);
  const [useProxy, setUseProxy] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // 检查是否是Notion图片
  const isNotionImage = src && (
    src.includes('prod-files-secure.s3.') || 
    src.includes('www.notion.so') ||
    src.includes('notion.so')
  );

  // 生成占位符SVG
  const placeholderSvg = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
    <svg width="320" height="320" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <g transform="translate(160, 160)">
        <rect x="-40" y="-40" width="80" height="80" fill="#e5e7eb" rx="8"/>
        <path d="M-24 -16L-8 0L-24 16M8 -16L24 0L8 16" stroke="#9ca3af" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="4" fill="#9ca3af"/>
      </g>
      <text x="50%" y="85%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">图片加载中...</text>
    </svg>
  `)}`;

  // 处理图片加载错误
  const handleError = () => {
    console.log(`Image load error for: ${src}, retry: ${retryCount}, useProxy: ${useProxy}`);
    
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      
      if (isNotionImage && !useProxy) {
        // 第一次重试：切换到代理
        setUseProxy(true);
      } else {
        // 其他重试：重新加载
        setTimeout(() => {
          setImageError(false);
        }, 1000 * (retryCount + 1)); // 逐渐增加延迟
      }
    } else {
      // 所有重试都失败了
      setImageError(true);
    }
  };

  // 对于Notion图片，默认使用代理
  useEffect(() => {
    if (isNotionImage) {
      setUseProxy(true);
    }
  }, [isNotionImage]);

  // 如果图片加载失败且重试次数用完，显示占位符
  if (imageError || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${props.className || ''}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={placeholderSvg}
          alt="图片加载失败"
          className={props.className || ''}
          style={props.fill ? { width: '100%', height: '100%' } : {
            width: props.width,
            height: props.height
          }}
        />
      </div>
    );
  }

  // 生成图片URL的函数
  const generateImageUrl = (targetSize?: string) => {
    const params = new URLSearchParams();
    params.set('url', src);
    
    if (targetSize && targetSize !== 'original') {
      params.set('size', targetSize);
    } else if (targetSize === 'original') {
      params.set('size', 'original');
    }
    
    if (quality !== 85 && targetSize !== 'original') {
      params.set('q', quality.toString());
    }
    
    // 如果指定了自定义宽高，优先使用
    if (props.width && !props.fill && targetSize !== 'original') {
      params.set('w', props.width.toString());
    }
    if (props.height && !props.fill && targetSize !== 'original') {
      params.set('h', props.height.toString());
    }
    
    return `/api/image-proxy?${params.toString()}`;
  };

  // 创建图片组件的函数
  const createImageComponent = (imgProps: any, key?: string) => {
    if (enableZoom) {
      // 为放大功能提供原图URL
      const originalImageUrl = isNotionImage ? generateImageUrl('original') : src;
      return (
        <ImageZoom key={key} src={originalImageUrl} alt={alt} className={props.className}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img alt={alt} {...imgProps} />
        </ImageZoom>
      );
    }
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img key={key} alt={alt} {...imgProps} />
    );
  };

  // 如果是Notion图片且使用代理
  if (isNotionImage && useProxy) {
    // 如果启用了响应式图片，生成srcSet
    if (responsive) {
      const srcSet = [
        `${generateImageUrl('small')} 320w`,
        `${generateImageUrl('medium')} 640w`,
        `${generateImageUrl('large')} 1024w`,
      ].join(', ');
      
      const defaultSizes = props.sizes || '(max-width: 640px) 320px, (max-width: 1024px) 640px, 1024px';
      
      const imageKey = `${generateImageUrl(size)}-${retryCount}`;
      const imgProps = {
        src: generateImageUrl(size),
        srcSet: srcSet,
        sizes: defaultSizes,
        alt: alt,
        className: props.className || '',
        style: props.fill ? { width: '100%', height: '100%', aspectRatio: '1' } : {
          width: props.width,
          height: props.height
        },
        onError: handleError,
        loading: props.loading,
        ...(props.fill ? { width: '100%', height: '100%' } : {
          width: props.width,
          height: props.height
        })
      };
      
      return createImageComponent(imgProps, imageKey);
    }
    
    // 非响应式图片
    const imageUrl = generateImageUrl(size);
    const imageKey = `${imageUrl}-${retryCount}`;
    
    const imgProps = {
      src: imageUrl,
      alt: alt,
      className: props.className || '',
      style: props.fill ? { width: '100%', height: '100%', aspectRatio: '1' } : {
        width: props.width,
        height: props.height
      },
      onError: handleError,
      loading: props.loading,
      ...(props.fill ? { width: '100%', height: '100%' } : {
        width: props.width,
        height: props.height
      })
    };
    
    return createImageComponent(imgProps, imageKey);
  }

  // 对于所有其他情况，也要确保Notion图片使用代理
  if (isNotionImage) {
    // 如果是Notion图片但没有使用代理，强制使用代理
    const imageUrl = generateImageUrl(size);
    const imageKey = `${imageUrl}-${retryCount}`;
    
    const imgProps = {
      src: imageUrl,
      alt: alt,
      className: props.className || '',
      style: props.fill ? { width: '100%', height: '100%', aspectRatio: '1' } : {
        width: props.width,
        height: props.height
      },
      onError: handleError,
      loading: props.loading,
      ...(props.fill ? { width: '100%', height: '100%' } : {
        width: props.width,
        height: props.height
      })
    };
    
    return createImageComponent(imgProps, imageKey);
  }

  // 只有非Notion图片才使用Next.js Image组件
  return (
    <Image
      {...props}
      src={src}
      alt={alt}
      onError={handleError}
      key={`${src}-${retryCount}`}
    />
  );
}