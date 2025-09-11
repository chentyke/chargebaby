import { NextRequest, NextResponse } from 'next/server';

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
    // 检查URL是否是Notion的S3链接
    const isNotionImage = imageUrl.includes('prod-files-secure.s3.') || 
                         imageUrl.includes('www.notion.so') ||
                         imageUrl.includes('notion.so');

    if (!isNotionImage) {
      return NextResponse.json(
        { error: 'Only Notion images are supported' },
        { status: 400 }
      );
    }

    // 获取图片数据
    const response = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      
      // 返回一个默认的占位图片
      return new NextResponse(null, {
        status: 404,
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      });
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('Content-Type') || 'image/jpeg';

    // 返回图片数据，设置长期缓存
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24小时缓存
        'CDN-Cache-Control': 'public, max-age=86400',
        'Vercel-CDN-Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Image proxy error:', error);
    
    // 返回404状态
    return new NextResponse(null, { status: 404 });
  }
}