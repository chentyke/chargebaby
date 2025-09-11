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
        // 查看图片缓存详细状态
        const imageStats = serverCache.getStats();
        const imageKeys = imageStats.keys.filter(key => key.startsWith('image:'));
        
        // 计算缓存大小估算（假设平均每张图片50KB）
        const estimatedSize = imageKeys.length * 50 * 1024; // bytes
        const estimatedSizeMB = (estimatedSize / (1024 * 1024)).toFixed(2);
        
        return NextResponse.json({
          success: true,
          data: {
            total: imageStats.size,
            images: imageKeys.length,
            dataCache: imageStats.size - imageKeys.length,
            estimatedImageCacheSize: `${estimatedSizeMB} MB`,
            imageKeys: imageKeys.slice(0, 10), // 只显示前10个
            cacheHitRate: '计算中...', // TODO: 实现命中率统计
          },
          timestamp: new Date().toISOString(),
        });

      case 'clear-images':
        // 清空图片缓存
        const allStats = serverCache.getStats();
        const imageKeysToDelete = allStats.keys.filter(key => key.startsWith('image:'));
        const sizeBefore = allStats.size;
        
        imageKeysToDelete.forEach(key => serverCache.delete(key));
        
        const sizeAfter = serverCache.getStats().size;
        console.log(`🗑️ Cleared ${imageKeysToDelete.length} image cache entries, cache size: ${sizeBefore} -> ${sizeAfter}`);
        
        return NextResponse.json({
          success: true,
          message: `Cleared ${imageKeysToDelete.length} image cache entries`,
          details: {
            cleared: imageKeysToDelete.length,
            cacheSizeBefore: sizeBefore,
            cacheSizeAfter: sizeAfter,
          },
          timestamp: new Date().toISOString(),
        });

      case 'optimize':
        // 优化缓存：清除过期的缓存项
        const beforeOptimize = serverCache.getStats();
        console.log(`🔧 Starting cache optimization, current size: ${beforeOptimize.size}`);
        
        // 这里可以添加清除过期缓存的逻辑
        // 当前的缓存系统已经自动处理过期，这个操作主要是统计
        
        const afterOptimize = serverCache.getStats();
        return NextResponse.json({
          success: true,
          message: 'Cache optimization completed',
          details: {
            before: beforeOptimize.size,
            after: afterOptimize.size,
            optimized: beforeOptimize.size - afterOptimize.size,
          },
          timestamp: new Date().toISOString(),
        });

      default:
        return NextResponse.json(
          { 
            success: false, 
            error: 'Invalid action. Supported actions: stats, clear, refresh, images, clear-images, optimize' 
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