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

    // 生成缓存键，包含分辨率信息
    const resolutionConfig = customWidth || customHeight ? 
      { width: customWidth, height: customHeight, quality } : 
      RESOLUTION_PRESETS[size];
    
    // 首先尝试从缓存获取
    const cached = ImageCache.get(imageUrl, resolutionConfig);
    if (cached) {
      console.log(`📦 Serving ${size} image from cache: ${imageUrl.substring(0, 50)}...`);
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7天缓存
          'X-Cache-Status': 'HIT',
          'X-Image-Size': size,
        },
      });
    }

    // 为不同分辨率创建独立的缓存键
    const cacheKey = `${imageUrl}:${size}:${customWidth || ''}x${customHeight || ''}:q${quality}`;
    
    // 检查是否已有相同的请求正在处理（防止重复获取）
    if (pendingRequests.has(cacheKey)) {
      console.log(`⏳ Waiting for pending ${size} request: ${imageUrl.substring(0, 50)}...`);
      return await pendingRequests.get(cacheKey)!;
    }

    console.log(`🌐 Fetching ${size} image from Notion: ${imageUrl.substring(0, 50)}...`);

    // 创建新的请求 Promise
    const fetchPromise = fetchImageWithRetry(imageUrl, resolutionConfig);
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
    const errorCacheKey = `${imageUrl}:${size}:${customWidth || ''}x${customHeight || ''}:q${quality}`;
    pendingRequests.delete(errorCacheKey);
    return ImageCache.getPlaceholderResponse();
  }
}

// 提取图片获取逻辑为独立函数
async function fetchImageWithRetry(
  imageUrl: string, 
  resolutionConfig: { width?: number | null; height?: number | null; quality?: number } | null
): Promise<NextResponse> {
  try {

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
        // 创建一个10秒超时的AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        response = await fetch(imageUrl, {
          ...options,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          console.log(`✅ Successfully fetched image with method ${fetchOptions.indexOf(options) + 1}`);
          break;
        } else {
          console.log(`❌ Method ${fetchOptions.indexOf(options) + 1} failed: ${response.status}`);
          response = null;
        }
      } catch (error) {
        console.log(`❌ Method ${fetchOptions.indexOf(options) + 1} error:`, error);
        lastError = error as Error;
        response = null;
      }
    }

    if (!response || !response.ok) {
      console.error(`Failed to fetch image after all attempts: ${imageUrl}`);
      if (lastError) {
        console.error('Last error:', lastError);
      }
      
      // 返回占位图
      return ImageCache.getPlaceholderResponse();
    }

    const originalBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';
    
    let processedBuffer = originalBuffer;
    let outputContentType = contentType;

    // 如果需要压缩或调整尺寸
    if (resolutionConfig && (resolutionConfig.width || resolutionConfig.height || resolutionConfig.quality)) {
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

    // 返回处理后的图片数据
    return new NextResponse(processedBuffer, {
      status: 200,
      headers: {
        'Content-Type': outputContentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7天缓存
        'X-Cache-Status': 'MISS',
        'X-Original-Size': originalBuffer.byteLength.toString(),
        'X-Compressed-Size': processedBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Image fetch error:', error);
    return ImageCache.getPlaceholderResponse();
  }
}