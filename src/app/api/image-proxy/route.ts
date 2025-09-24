import { NextRequest, NextResponse } from 'next/server';
import { ImageCache } from '@/lib/image-cache';
import sharp from 'sharp';

// 请求去重：防止同一张图片被同时请求多次
const pendingRequests = new Map<string, Promise<NextResponse>>();

// 预定义的分辨率配置
const RESOLUTION_PRESETS = {
  'thumbnail': { width: 150, height: 150, quality: 80 },
  'small': { width: 320, height: 320, quality: 85 },
  'medium': { width: 640, height: 640, quality: 85 },
  'large': { width: 1024, height: 1024, quality: 90 },
  'original': null // 原始尺寸
} as const;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');
  const size = searchParams.get('size') as keyof typeof RESOLUTION_PRESETS || 'medium';
  const customWidth = searchParams.get('w') ? parseInt(searchParams.get('w')!) : null;
  const customHeight = searchParams.get('h') ? parseInt(searchParams.get('h')!) : null;
  const quality = searchParams.get('q') ? parseInt(searchParams.get('q')!) : 85;
  
  // 获取客户端的条件请求头
  const ifNoneMatch = request.headers.get('if-none-match');
  const ifModifiedSince = request.headers.get('if-modified-since');

  if (!imageUrl) {
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 }
    );
  }

  try {
    // 检查URL是否是Notion图片
    if (!ImageCache.isNotionImage(imageUrl)) {
      return NextResponse.json(
        { error: 'Only Notion images are supported' },
        { status: 400 }
      );
    }

    // 标准化分辨率配置，减少缓存键变体
    const resolutionConfig = customWidth || customHeight ? 
      { width: customWidth, height: customHeight, quality } : 
      RESOLUTION_PRESETS[size];
    
    // 生成稳定的ETag
    const etag = ImageCache.generateETag(imageUrl, resolutionConfig);
    
    // 检查客户端缓存（304响应）
    if (ifNoneMatch === etag) {
      return new NextResponse(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable', // 30天缓存
          'X-Cache-Status': 'CLIENT-HIT',
        },
      });
    }
    
    // 首先尝试从服务端缓存获取
    const cached = ImageCache.get(imageUrl, resolutionConfig);
    if (cached) {
      console.log(`📦 Serving ${size} image from server cache: ${imageUrl.substring(0, 50)}...`);
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'ETag': etag,
          'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable', // 30天缓存
          'X-Cache-Status': 'SERVER-HIT',
          'X-Image-Size': size,
          'Last-Modified': new Date(cached.timestamp).toUTCString(),
        },
      });
    }

    // 生成稳定的缓存键用于请求去重（也使用规范化URL）
    const normalizedUrl = ImageCache.normalizeAwsUrl(imageUrl);
    const cacheKey = `${normalizedUrl}:${size}:${customWidth || ''}x${customHeight || ''}:q${quality}`;
    
    // 检查是否已有相同的请求正在处理（防止重复获取）
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending ${size} request: ${imageUrl.substring(0, 50)}...`);
      return await pendingRequests.get(cacheKey)!;
    }

    console.log(`🌐 Fetching ${size} image from Notion: ${imageUrl.substring(0, 50)}... [CDN-MISS]`);

    // 创建新的请求 Promise
    const fetchPromise = fetchImageWithRetry(imageUrl, resolutionConfig, size);
    pendingRequests.set(cacheKey, fetchPromise);

    try {
      const response = await fetchPromise;
      return response;
    } finally {
      // 请求完成后清除 pending 状态
      pendingRequests.delete(cacheKey);
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    // 清理可能的pending请求  
    const normalizedUrl = ImageCache.normalizeAwsUrl(imageUrl);
    const errorCacheKey = `${normalizedUrl}:${size}:${customWidth || ''}x${customHeight || ''}:q${quality}`;
    pendingRequests.delete(errorCacheKey);
    
    // 返回带有适当缓存头的错误响应
    const errorResponse = ImageCache.getPlaceholderResponse();
    errorResponse.headers.set('Cache-Control', 'public, max-age=300'); // 5分钟缓存错误
    errorResponse.headers.set('X-Cache-Status', 'ERROR');
    return errorResponse;
  }
}

// 提取图片获取逻辑为独立函数
async function fetchImageWithRetry(
  imageUrl: string, 
  resolutionConfig: { width?: number | null; height?: number | null; quality?: number } | null,
  size: keyof typeof RESOLUTION_PRESETS
): Promise<NextResponse> {
  try {
    // 检查AWS签名URL是否可能已过期
    try {
      const urlObj = new URL(imageUrl);
      if (urlObj.host.includes('amazonaws.com')) {
        const expiresParam = urlObj.searchParams.get('X-Amz-Expires');
        const dateParam = urlObj.searchParams.get('X-Amz-Date');
        
        if (expiresParam && dateParam) {
          // 解析签名时间和过期时间
          const signTime = new Date(dateParam.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z'));
          const expiresIn = parseInt(expiresParam);
          const expiryTime = new Date(signTime.getTime() + expiresIn * 1000);
          
          if (new Date() > expiryTime) {
            console.warn(`⚠️ AWS signed URL may have expired. Signed: ${signTime.toISOString()}, Expires: ${expiryTime.toISOString()}`);
          }
        }
      }
    } catch (urlError) {
      console.log('URL validation error (continuing anyway):', urlError);
    }

    // 尝试多种方式获取图片
    const fetchOptions: RequestInit[] = [
      // 尝试1: 标准浏览器User-Agent
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': 'https://www.notion.so/',
          'Sec-Fetch-Dest': 'image',
          'Sec-Fetch-Mode': 'no-cors',
          'Sec-Fetch-Site': 'cross-site',
        },
      },
      // 尝试2: 不同的浏览器
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Referer': 'https://notion.so/',
        },
      },
      // 尝试3: 简化headers
      {
        headers: {
          'User-Agent': 'curl/8.0.0',
          'Accept': '*/*',
        },
      },
      // 尝试4: wget风格
      {
        headers: {
          'User-Agent': 'Wget/1.21.1',
        },
      },
      // 尝试5: 无headers
      {},
    ];

    let response: Response | null = null;
    let lastError: Error | null = null;

    for (const options of fetchOptions) {
      try {
        // 创建一个15秒超时的AbortController（增加超时时间）
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        response = await fetch(imageUrl, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Successfully fetched image with method ${fetchOptions.indexOf(options) + 1}`);
          break;
        } else {
          console.log(`❌ Method ${fetchOptions.indexOf(options) + 1} failed: ${response.status} ${response.statusText}`);
          response = null;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.log(`❌ Method ${fetchOptions.indexOf(options) + 1} error: ${errorMsg}`);
        
        // 如果是AbortError，说明是超时，继续尝试下一个方法
        if (errorMsg.includes('aborted') || errorMsg.includes('timeout')) {
          console.log(`⏱️ Request timeout, trying next method...`);
        }
        
        lastError = error as Error;
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error(`Failed to fetch image after all attempts: ${imageUrl}`);
      if (lastError) {
        console.error('Last error:', lastError);
      }
      
      // 返回占位图，短时间缓存避免重复请求
      const placeholderResponse = ImageCache.getPlaceholderResponse();
      placeholderResponse.headers.set('Cache-Control', 'public, max-age=300'); // 5分钟
      placeholderResponse.headers.set('X-Cache-Status', 'FETCH-ERROR');
      return placeholderResponse;
    }

    const originalBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    let processedBuffer = originalBuffer;
    let outputContentType = contentType;

    // 如果需要压缩或调整尺寸（original尺寸时跳过处理）
    const shouldProcess = size !== 'original' && resolutionConfig && 
      (resolutionConfig.width || resolutionConfig.height || resolutionConfig.quality);
    
    if (shouldProcess) {
      try {
        let sharpInstance = sharp(Buffer.from(originalBuffer));
        
        // 获取原图信息
        const metadata = await sharpInstance.metadata();
        console.log(`📐 Original image size: ${metadata.width}x${metadata.height}`);
        
        // 调整尺寸（保持宽高比）
        if (resolutionConfig.width || resolutionConfig.height) {
          sharpInstance = sharpInstance.resize(resolutionConfig.width, resolutionConfig.height, {
            fit: 'inside',
            withoutEnlargement: true // 不放大小图
          });
        }
        
        // 设置质量和格式
        const quality = resolutionConfig.quality || 85;
        if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          sharpInstance = sharpInstance.jpeg({ quality });
          outputContentType = 'image/jpeg';
        } else if (contentType.includes('png')) {
          sharpInstance = sharpInstance.png({ quality });
          outputContentType = 'image/png';
        } else if (contentType.includes('webp')) {
          sharpInstance = sharpInstance.webp({ quality });
          outputContentType = 'image/webp';
        } else {
          // 对于其他格式，转换为JPEG
          sharpInstance = sharpInstance.jpeg({ quality });
          outputContentType = 'image/jpeg';
        }
        
        const processedImage = await sharpInstance.toBuffer();
        processedBuffer = new Uint8Array(processedImage).buffer;
        
        const finalMetadata = await sharp(processedImage).metadata();
        console.log(`🎯 Processed image size: ${finalMetadata.width}x${finalMetadata.height}, quality: ${quality}`);
        console.log(`📊 Size reduction: ${Math.round(((originalBuffer.byteLength - processedBuffer.byteLength) / originalBuffer.byteLength) * 100)}%`);
        
      } catch (sharpError) {
        console.warn('Sharp processing failed, using original image:', sharpError);
        processedBuffer = originalBuffer;
        outputContentType = contentType;
      }
    }

    // 缓存处理后的图片
    ImageCache.set(imageUrl, processedBuffer, outputContentType, resolutionConfig);
    console.log(`✅ Image cached successfully: ${imageUrl.substring(0, 50)}...`);

    // 生成稳定的ETag用于CDN缓存
    const responseETag = ImageCache.generateETag(imageUrl, resolutionConfig);
    const lastModified = new Date().toUTCString();
    
    // 返回处理后的图片数据
    return new NextResponse(processedBuffer, {
      status: 200,
      headers: {
        'Content-Type': outputContentType,
        'ETag': responseETag,
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable', // 30天缓存
        'X-Cache-Status': 'CDN-MISS',
        'X-Original-Size': originalBuffer.byteLength.toString(),
        'X-Compressed-Size': processedBuffer.byteLength.toString(),
        'X-Image-ID': ImageCache.generateETag(imageUrl, resolutionConfig).replace(/"/g, ''),
        'Last-Modified': lastModified,
      },
    });

  } catch (error) {
    console.error('Image fetch error:', error);
    return ImageCache.getPlaceholderResponse();
  }
}