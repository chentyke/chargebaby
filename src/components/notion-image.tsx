'use client';

import Image from 'next/image';
import { useState } from 'react';

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

  // 检查是否是Notion图片
  const isNotionImage = src && (
    src.includes('prod-files-secure.s3.') || 
    src.includes('www.notion.so') ||
    src.includes('notion.so')
  );

  // 如果发生错误且是Notion图片，尝试使用代理
  const handleError = () => {
    if (isNotionImage && !useProxy) {
      setUseProxy(true);
    } else {
      setImageError(true);
    }
  };

  // 如果图片加载失败，显示占位符
  if (imageError || !src) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${props.className || ''}`}>
        <svg 
          className="w-12 h-12 text-gray-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={1} 
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
          />
        </svg>
      </div>
    );
  }

  // 决定使用的图片URL
  const imageUrl = useProxy && isNotionImage 
    ? `/api/image-proxy?url=${encodeURIComponent(src)}`
    : src;

  return (
    <Image
      {...props}
      src={imageUrl}
      alt={alt}
      onError={handleError}
    />
  );
}