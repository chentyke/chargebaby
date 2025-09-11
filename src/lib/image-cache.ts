import { serverCache, CACHE_KEYS } from './cache';
import { NextResponse } from 'next/server';

interface ImageCacheItem {
  buffer: ArrayBuffer;
  contentType: string;
  timestamp: number;
}

const IMAGE_CACHE_TTL = 7 * 24 * 60 * 60; // 7天缓存

export class ImageCache {
  /**
   * 获取图片的缓存键，支持分辨率区分
   */
  private static getCacheKey(
    url: string, 
    resolutionConfig?: { width?: number | null; height?: number | null; quality?: number } | null
  ): string {
    // 移除查询参数中的签名信息，保留基础URL
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
    
    // 生成分辨率标识符
    let resolutionSuffix = '';
    if (resolutionConfig) {
      const width = resolutionConfig.width || 'auto';
      const height = resolutionConfig.height || 'auto';
      const quality = resolutionConfig.quality || 85;
      resolutionSuffix = `:${width}x${height}:q${quality}`;
    }
    
    // 使用简单的hash而不是base64
    const fullKey = baseUrl + resolutionSuffix;
    let hash = 0;
    for (let i = 0; i < fullKey.length; i++) {
      const char = fullKey.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return `image:${Math.abs(hash).toString(36)}`;
  }

  /**
   * 从缓存获取图片
   */
  static get(
    url: string, 
    resolutionConfig?: { width?: number | null; height?: number | null; quality?: number } | null
  ): ImageCacheItem | null {
    const cacheKey = this.getCacheKey(url, resolutionConfig);
    return serverCache.get<ImageCacheItem>(cacheKey);
  }

  /**
   * 缓存图片
   */
  static set(
    url: string, 
    buffer: ArrayBuffer, 
    contentType: string, 
    resolutionConfig?: { width?: number | null; height?: number | null; quality?: number } | null
  ): void {
    const cacheKey = this.getCacheKey(url, resolutionConfig);
    const item: ImageCacheItem = {
      buffer,
      contentType,
      timestamp: Date.now(),
    };
    serverCache.set(cacheKey, item, IMAGE_CACHE_TTL);
    
    const resolutionInfo = resolutionConfig ? 
      ` (${resolutionConfig.width || 'auto'}x${resolutionConfig.height || 'auto'} q${resolutionConfig.quality || 85})` : 
      ' (original)';
    console.log(`📸 Cached image${resolutionInfo}: ${cacheKey.substring(0, 20)}...`);
  }

  /**
   * 检查URL是否是Notion图片
   */
  static isNotionImage(url: string): boolean {
    return url.includes('prod-files-secure.s3.') || 
           url.includes('www.notion.so') ||
           url.includes('notion.so');
  }

  /**
   * 生成占位图SVG
   */
  static generatePlaceholderSVG(width: number = 320, height: number = 320): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <g transform="translate(${width/2}, ${height/2})">
        <rect x="-40" y="-40" width="80" height="80" fill="#e5e7eb" rx="8"/>
        <path d="M-24 -16L-8 0L-24 16M8 -16L24 0L8 16" stroke="#9ca3af" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
        <circle cx="0" cy="0" r="4" fill="#9ca3af"/>
      </g>
      <text x="50%" y="85%" text-anchor="middle" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">图片加载失败</text>
    </svg>`;
  }

  /**
   * 获取占位图响应
   */
  static getPlaceholderResponse(): NextResponse {
    const svg = this.generatePlaceholderSVG();
    return new NextResponse(svg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }
}