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
   * 提取Notion图片的稳定ID
   */
  private static extractNotionImageId(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      // 从路径中提取文件ID（Notion图片路径格式）
      const pathMatch = pathname.match(/\/([a-f0-9-]{36})\//);
      if (pathMatch) {
        return pathMatch[1];
      }
      
      // 备选方案：使用文件名部分
      const fileMatch = pathname.match(/\/([^/]+)\.[^.]+$/);
      if (fileMatch) {
        return fileMatch[1];
      }
      
      // 最后备选：使用整个路径的hash
      return this.simpleHash(pathname);
    } catch {
      return this.simpleHash(url);
    }
  }

  /**
   * 简单hash函数
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * 规范化AWS签名URL，移除动态参数，确保缓存一致性
   */
  static normalizeAwsUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // 对于AWS S3签名URL，移除所有动态参数
      if (urlObj.host.includes('amazonaws.com')) {
        // 只保留基础路径，移除所有查询参数
        return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
      }
      
      // 对于其他URL，保留非动态参数
      const stableParams = new URLSearchParams();
      urlObj.searchParams.forEach((value, key) => {
        // 移除已知的动态参数
        if (!key.startsWith('X-Amz-') && 
            key !== 'timestamp' && 
            key !== 'expires' &&
            key !== 'signature') {
          stableParams.set(key, value);
        }
      });
      
      const queryString = stableParams.toString();
      return `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}${queryString ? '?' + queryString : ''}`;
    } catch {
      return url;
    }
  }

  /**
   * 获取图片的缓存键，确保每个图片都有唯一键
   */
  private static getCacheKey(
    url: string, 
    resolutionConfig?: { width?: number | null; height?: number | null; quality?: number } | null
  ): string {
    // 规范化URL，移除动态参数
    const normalizedUrl = this.normalizeAwsUrl(url);
    const imageId = this.simpleHash(normalizedUrl);
    
    // 标准化分辨率配置，减少缓存键变体
    let resolutionSuffix = '';
    if (resolutionConfig) {
      const width = resolutionConfig.width || 'auto';
      const height = resolutionConfig.height || 'auto';
      const quality = resolutionConfig.quality || 85;
      
      // 将质量标准化为几个固定值，减少碎片化
      const normalizedQuality = quality >= 95 ? 95 : 
                               quality >= 85 ? 85 : 
                               quality >= 75 ? 75 : 65;
      
      resolutionSuffix = `:${width}x${height}:q${normalizedQuality}`;
    }
    
    return `image:${imageId}${resolutionSuffix}`;
  }

  /**
   * 生成稳定的ETag
   */
  static generateETag(
    url: string,
    resolutionConfig?: { width?: number | null; height?: number | null; quality?: number } | null
  ): string {
    // 使用相同的规范化逻辑确保ETag一致性
    const normalizedUrl = this.normalizeAwsUrl(url);
    const imageId = this.simpleHash(normalizedUrl);
    
    // 标准化分辨率配置，确保相同配置生成相同的ETag
    let configHash = 'orig';
    if (resolutionConfig) {
      const width = resolutionConfig.width || 'auto';
      const height = resolutionConfig.height || 'auto';
      const quality = resolutionConfig.quality || 85;
      
      // 将质量标准化为几个固定值，减少ETag碎片化
      const normalizedQuality = quality >= 95 ? 95 : 
                               quality >= 85 ? 85 : 
                               quality >= 75 ? 75 : 65;
      
      const configString = `${width}x${height}:q${normalizedQuality}`;
      configHash = this.simpleHash(configString);
    }
    
    return `"${imageId}-${configHash}"`;
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
    console.log(`📸 Cached image${resolutionInfo}: ${cacheKey} | Size: ${(buffer.byteLength / 1024).toFixed(1)}KB`);
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