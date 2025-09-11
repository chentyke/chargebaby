import { NextRequest, NextResponse } from 'next/server';
import { ImageCache } from '@/lib/image-cache';

// 请求去重：防止同一张图片被同时请求多次
const pendingRequests = new Map<string, Promise<NextResponse>>();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

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

    // 首先尝试从缓存获取
    const cached = ImageCache.get(imageUrl);
    if (cached) {
      console.log(`📦 Serving image from cache: ${imageUrl.substring(0, 50)}...`);
      return new NextResponse(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7天缓存
          'X-Cache-Status': 'HIT',
        },
      });
    }

    // 检查是否已有相同的请求正在处理（防止重复获取）
    if (pendingRequests.has(imageUrl)) {
      console.log(`⏳ Waiting for pending request: ${imageUrl.substring(0, 50)}...`);
      return await pendingRequests.get(imageUrl)!;
    }

    console.log(`🌐 Fetching image from Notion: ${imageUrl.substring(0, 50)}...`);

    // 创建新的请求 Promise
    const fetchPromise = fetchImageWithRetry(imageUrl);
    pendingRequests.set(imageUrl, fetchPromise);

    try {
      const response = await fetchPromise;
      return response;
    } finally {
      // 请求完成后清除 pending 状态
      pendingRequests.delete(imageUrl);
    }
  } catch (error) {
    console.error('Image proxy error:', error);
    pendingRequests.delete(imageUrl);
    return ImageCache.getPlaceholderResponse();
  }
}

// 提取图片获取逻辑为独立函数
async function fetchImageWithRetry(imageUrl: string): Promise<NextResponse> {
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

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // 缓存图片
    ImageCache.set(imageUrl, imageBuffer, contentType);
    console.log(`✅ Image cached successfully: ${imageUrl.substring(0, 50)}...`);

    // 返回图片数据
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, s-maxage=604800', // 7天缓存
        'X-Cache-Status': 'MISS',
      },
    });

  } catch (error) {
    console.error('Image fetch error:', error);
    return ImageCache.getPlaceholderResponse();
  }
}