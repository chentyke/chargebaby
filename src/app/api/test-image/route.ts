import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({
      success: false,
      error: 'Missing image URL parameter',
      usage: 'GET /api/test-image?url=<notion_image_url>'
    }, { status: 400 });
  }

  try {
    // 测试原始URL
    console.log(`Testing original URL: ${imageUrl}`);
    const originalResponse = await fetch(imageUrl, {
      method: 'HEAD', // 只检查头部
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const originalStatus = originalResponse.status;
    console.log(`Original URL status: ${originalStatus}`);

    // 测试代理URL
    const proxyUrl = `${request.nextUrl.origin}/api/image-proxy?url=${encodeURIComponent(imageUrl)}`;
    console.log(`Testing proxy URL: ${proxyUrl}`);
    
    const proxyResponse = await fetch(proxyUrl, {
      method: 'HEAD', // 只检查头部
    });

    const proxyStatus = proxyResponse.status;
    const cacheStatus = proxyResponse.headers.get('X-Cache-Status') || 'unknown';
    console.log(`Proxy URL status: ${proxyStatus}, cache: ${cacheStatus}`);

    return NextResponse.json({
      success: true,
      imageUrl,
      tests: {
        original: {
          status: originalStatus,
          working: originalStatus === 200,
        },
        proxy: {
          status: proxyStatus,
          working: proxyStatus === 200,
          cacheStatus,
        }
      },
      recommendation: originalStatus === 200 
        ? "Original URL is working, but proxy provides caching benefits"
        : proxyStatus === 200 
          ? "Original URL failed, but proxy is working - good!"
          : "Both original and proxy failed - there might be a deeper issue",
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Test image error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to test image URLs',
      details: error instanceof Error ? error.message : 'Unknown error',
      imageUrl,
    }, { status: 500 });
  }
}