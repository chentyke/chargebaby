import { NextRequest, NextResponse } from 'next/server';
import { ImageCache } from '@/lib/image-cache';

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

    console.log(`🌐 Fetching image from Notion: ${imageUrl.substring(0, 50)}...`);

    // 尝试多种方式获取图片
    const fetchOptions: RequestInit[] = [
      // 尝试1: 标准User-Agent
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://www.notion.so/',
        },
      },
      // 尝试2: 简化headers
      {
        headers: {
          'User-Agent': 'curl/7.68.0',
        },
      },
      // 尝试3: 无headers
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
    console.error('Image proxy error:', error);
    
    // 返回占位图而不是错误
    return ImageCache.getPlaceholderResponse();
  }
}