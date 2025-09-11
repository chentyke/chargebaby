'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';

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
}

export function NotionImage({ src, alt, ...props }: NotionImageProps) {
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
          style={props.fill ? { width: '100%', height: '100%', objectFit: 'contain' } : {
            width: props.width,
            height: props.height
          }}
        />
      </div>
    );
  }

  // 如果是Notion图片且使用代理，直接返回img标签而不是Next.js Image组件
  if (isNotionImage && useProxy) {
    const imageUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageUrl}
        alt={alt}
        className={props.className || ''}
        style={props.fill ? { width: '100%', height: '100%', objectFit: 'contain' } : {
          width: props.width,
          height: props.height
        }}
        onError={handleError}
        loading={props.loading}
        key={`${imageUrl}-${retryCount}`}
      />
    );
  }

  // 对于所有其他情况，也要确保Notion图片使用代理
  if (isNotionImage) {
    // 如果是Notion图片但没有使用代理，强制使用代理
    const imageUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    
    return (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={imageUrl}
        alt={alt}
        className={props.className || ''}
        style={props.fill ? { width: '100%', height: '100%', objectFit: 'contain' } : {
          width: props.width,
          height: props.height
        }}
        onError={handleError}
        loading={props.loading}
        key={`${imageUrl}-${retryCount}`}
      />
    );
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