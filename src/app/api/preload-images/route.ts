import { NextRequest, NextResponse } from 'next/server';
import { ImageCache } from '@/lib/image-cache';

export async function POST(request: NextRequest) {
  try {
    const { imageUrls }: { imageUrls: string[] } = await request.json();

    if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Invalid imageUrls array' },
        { status: 400 }
      );
    }

    console.log(`🚀 Starting batch preload for ${imageUrls.length} images`);

    const results = await Promise.allSettled(
      imageUrls.map(async (imageUrl, index) => {
        // 检查是否已经缓存
        if (ImageCache.get(imageUrl)) {
          console.log(`⚡ Image ${index + 1}/${imageUrls.length} already cached`);
          return { url: imageUrl, status: 'cached', cached: true };
        }

        try {
          // 调用图片代理 API 获取并缓存图片
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/image-proxy?url=${encodeURIComponent(imageUrl)}`,
            { method: 'GET' }
          );

          if (response.ok) {
            console.log(`✅ Image ${index + 1}/${imageUrls.length} preloaded successfully`);
            return { url: imageUrl, status: 'success', cached: false };
          } else {
            console.log(`❌ Image ${index + 1}/${imageUrls.length} preload failed: ${response.status}`);
            return { url: imageUrl, status: 'failed', cached: false };
          }
        } catch (error) {
          console.log(`❌ Image ${index + 1}/${imageUrls.length} preload error:`, error);
          return { url: imageUrl, status: 'error', cached: false };
        }
      })
    );

    const summary = results.reduce(
      (acc, result) => {
        if (result.status === 'fulfilled') {
          const value = result.value;
          if (value.cached) {
            acc.alreadyCached++;
          } else if (value.status === 'success') {
            acc.preloaded++;
          } else {
            acc.failed++;
          }
        } else {
          acc.failed++;
        }
        return acc;
      },
      { preloaded: 0, alreadyCached: 0, failed: 0 }
    );

    console.log(`🎉 Batch preload completed:`, summary);

    return NextResponse.json({
      success: true,
      summary,
      details: results.map(result => 
        result.status === 'fulfilled' ? result.value : { status: 'error' }
      ),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Batch preload error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Batch Image Preload API',
    description: 'POST endpoint to preload multiple images at once',
    usage: {
      method: 'POST',
      body: {
        imageUrls: ['url1', 'url2', '...']
      }
    },
    example: `
      POST /api/preload-images
      {
        "imageUrls": [
          "https://notion-image-1.png",
          "https://notion-image-2.png"
        ]
      }
    `,
    timestamp: new Date().toISOString(),
  });
}
