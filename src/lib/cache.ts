import { ChargeBaby } from '@/types/chargebaby';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // 生存时间（毫秒）
}

class ServerCache {
  private cache = new Map<string, CacheItem<any>>();
  private refreshIntervals = new Map<string, NodeJS.Timeout>();

  /**
   * 设置缓存项
   */
  set<T>(key: string, data: T, ttlSeconds: number = 60): void {
    const ttl = ttlSeconds * 1000;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });

    // 清除之前的定时器
    const existingInterval = this.refreshIntervals.get(key);
    if (existingInterval) {
      clearInterval(existingInterval);
    }
  }

  /**
   * 获取缓存项
   */
  get<T>(key: string, allowStale: boolean = false): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    const isExpired = now - item.timestamp > item.ttl;

    if (isExpired && !allowStale) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 设置自动刷新缓存
   */
  setWithAutoRefresh<T>(
    key: string, 
    data: T, 
    ttlSeconds: number = 60,
    refreshFunction?: () => Promise<T>
  ): void {
    this.set(key, data, ttlSeconds);

    if (refreshFunction) {
      // 设置定时刷新
      const interval = setInterval(async () => {
        try {
          console.log(`🔄 Refreshing cache for key: ${key}`);
          const newData = await refreshFunction();
          this.set(key, newData, ttlSeconds);
          console.log(`✅ Cache refreshed for key: ${key}`);
        } catch (error) {
          console.error(`❌ Failed to refresh cache for key: ${key}`, error);
        }
      }, ttlSeconds * 1000);

      this.refreshIntervals.set(key, interval);
    }
  }

  /**
   * 删除缓存项
   */
  delete(key: string): void {
    this.cache.delete(key);
    const interval = this.refreshIntervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.refreshIntervals.delete(key);
    }
    console.log(`🗑️  Deleted cache key: ${key}`);
  }

  /**
   * 按前缀批量删除缓存项
   */
  deleteByPrefix(prefix: string): number {
    const keys = Array.from(this.cache.keys());
    const matchingKeys = keys.filter(key => key.startsWith(prefix));
    
    matchingKeys.forEach(key => this.delete(key));
    
    console.log(`🗑️  Deleted ${matchingKeys.length} cache entries with prefix: ${prefix}`);
    return matchingKeys.length;
  }

  /**
   * 智能缓存失效 - 根据页面ID清除相关缓存
   */
  invalidatePageCache(pageId: string): void {
    console.log(`🔄 Invalidating cache for page: ${pageId}`);
    
    // 删除具体页面缓存
    const pageKey = `charge-baby-${pageId}`;
    this.delete(pageKey);
    
    // 删除主列表缓存（因为列表中可能包含更新的页面）
    this.delete('charge-babies');
    
    console.log(`✅ Page cache invalidated: ${pageId}`);
  }

  /**
   * 智能缓存失效 - 数据库结构更新
   */
  invalidateSchemaCache(): void {
    console.log('🏗️  Invalidating cache due to schema update');
    
    // 清除所有充电宝相关缓存
    const deletedCount = this.deleteByPrefix('charge-baby');
    
    console.log(`✅ Schema cache invalidated, cleared ${deletedCount} entries`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    this.refreshIntervals.clear();
  }

  /**
   * 获取缓存状态
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 全局缓存实例
export const serverCache = new ServerCache();

// 缓存键常量
export const CACHE_KEYS = {
  CHARGE_BABIES: 'charge-babies',
  CHARGE_BABY_BY_ID: (id: string) => `charge-baby-${id}`,
  CABLES: 'cables',
  CABLE_BY_ID: (id: string) => `cable-${id}`,
  WISHLIST_PRODUCTS: 'wishlist-products',
  WISHLIST_PRODUCT_BY_ID: (id: string) => `wishlist-product-${id}`,
  NOTICES: 'notices',
  NOTICE_BY_ID: (id: string) => `notice-${id}`,
  DOCS: 'docs',
  DOC_BY_PATH: (path: string) => `doc-${path}`,
} as const;