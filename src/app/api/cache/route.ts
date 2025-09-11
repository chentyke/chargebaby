import { NextRequest, NextResponse } from 'next/server';
import { serverCache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'stats':
        // 获取缓存统计信息
        const stats = serverCache.getStats();
        return NextResponse.json({
          success: true,
          data: stats,
          timestamp: new Date().toISOString(),
        });

      case 'clear':
        // 清空所有缓存
        serverCache.clear();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
          timestamp: new Date().toISOString(),
        });

      case 'refresh':
        // 手动刷新主缓存
        try {
          const { getChargeBabies } = await import('@/lib/notion');
          serverCache.delete('charge-babies');
          await getChargeBabies(); // 这会重新获取并缓存数据
          return NextResponse.json({
            success: true,
            message: 'Cache refreshed successfully',
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          return NextResponse.json({
            success: false,
            error: 'Failed to refresh cache',
            timestamp: new Date().toISOString(),
          }, { status: 500 });
        }

      case 'images':
        // 查看图片缓存状态
        const imageStats = serverCache.getStats();
        const imageKeys = imageStats.keys.filter(key => key.startsWith('image:'));
        return NextResponse.json({
          success: true,
          data: {
            total: imageStats.size,
            images: imageKeys.length,
            imageKeys: imageKeys.slice(0, 10), // 只显示前10个
          },
          timestamp: new Date().toISOString(),
        });

      case 'clear-images':
        // 清空图片缓存
        const allStats = serverCache.getStats();
        const imageKeysToDelete = allStats.keys.filter(key => key.startsWith('image:'));
        imageKeysToDelete.forEach(key => serverCache.delete(key));
        return NextResponse.json({
          success: true,
          message: `Cleared ${imageKeysToDelete.length} image cache entries`,
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: stats, clear, refresh, images, clear-images' 
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Cache API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}

// 可选：添加 POST 方法用于手动刷新特定缓存
export async function POST(request: NextRequest) {
  try {
    const { key } = await request.json();
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Cache key is required' },
        { status: 400 }
      );
    }

    // 删除指定缓存项，下次访问时将重新获取
    serverCache.delete(key);

    return NextResponse.json({
      success: true,
      message: `Cache key "${key}" deleted successfully`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Cache POST API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}