'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Cable, CableSortOption } from '@/types/cable';
import { CableCard } from '@/components/cable-card';
import { CableListCard } from '@/components/cable-list-card';
import { useGenericImagePreloader } from '@/hooks/useGenericImagePreloader';
import { cn } from '@/lib/utils';
import { getStoredViewMode, setStoredViewMode, getStoredScrollPosition } from '@/utils/view-mode-storage';

interface SearchableCableGridProps {
  cables: Cable[];
  initialViewMode?: 'grid' | 'list';
}

type ViewMode = 'grid' | 'list';

export function SearchableCableGrid({ cables, initialViewMode }: SearchableCableGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredByFilter, setFilteredByFilter] = useState<Cable[]>(cables);
  const [currentSortBy, setCurrentSortBy] = useState<CableSortOption>('updatedAt');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isClient, setIsClient] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);

  const pathname = usePathname();
  const router = useRouter();

  // 启用智能图片预加载
  useGenericImagePreloader(cables, true);

  const filteredCables = useMemo(() => {
    const baseCables = filteredByFilter;

    if (!searchQuery.trim()) {
      return baseCables;
    }

    const query = searchQuery.toLowerCase().trim();
    return baseCables.filter((cable) => {
      const searchFields = [
        cable.title,
        cable.displayName,
        cable.brand,
        cable.model,
        cable.subtitle,
        ...(Array.isArray(cable.tags) ? cable.tags : [])
      ].filter(Boolean);

      return searchFields.some(field =>
        field?.toLowerCase().includes(query)
      );
    });
  }, [filteredByFilter, searchQuery]);

  const sortedCables = useMemo(() => {
    const sorted = [...filteredCables].sort((a, b) => {
      switch (currentSortBy) {
        case 'alphabetical':
          return (a.title || '').localeCompare(b.title || '', 'zh-CN');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'power':
          return (b.detailData?.maxPower || 0) - (a.detailData?.maxPower || 0);
        case 'length':
          return (b.detailData?.length || 0) - (a.detailData?.length || 0);
        case 'weight':
          return (a.detailData?.weight || 0) - (b.detailData?.weight || 0);
        case 'overallRating':
          return (b.overallRating || 0) - (a.overallRating || 0);
        case 'performanceRating':
          return (b.performanceRating || 0) - (a.performanceRating || 0);
        case 'experienceRating':
          return (b.experienceRating || 0) - (a.experienceRating || 0);
        case 'updatedAt':
        default:
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return sorted;
  }, [filteredCables, currentSortBy]);

  // 客户端初始化
  useEffect(() => {
    setIsClient(true);

    // 初始化视图模式
    const storedViewMode = getStoredViewMode();
    const initialMode = initialViewMode || storedViewMode || 'grid';
    setViewMode(initialMode as ViewMode);

    // 恢复滚动位置
    const scrollPosition = getStoredScrollPosition(pathname, initialMode as ViewMode);
    if (scrollPosition && scrollPosition > 0) {
      setTimeout(() => {
        window.scrollTo({
          top: scrollPosition,
          behavior: 'instant'
        });
        setScrollRestored(true);
      }, 100);
    } else {
      setScrollRestored(true);
    }
  }, [initialViewMode]);

  // 保存滚动位置
  useEffect(() => {
    if (!isClient || !scrollRestored) return;

    const saveScrollPosition = () => {
      sessionStorage.setItem('cable-scroll-position', window.scrollY.toString());
    };

    const throttledSave = throttle(saveScrollPosition, 200);
    window.addEventListener('scroll', throttledSave);
    return () => window.removeEventListener('scroll', throttledSave);
  }, [isClient, scrollRestored]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode);

    // 更新URL参数
    const params = new URLSearchParams(window.location.search);
    if (mode === 'list') {
      params.set('view', 'list');
    } else {
      params.delete('view');
    }

    const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(newUrl, { scroll: false });
  }, [pathname, router]);

  const handleSortChange = useCallback((sortBy: CableSortOption) => {
    setCurrentSortBy(sortBy);
  }, []);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleFilterChange = useCallback((filtered: Cable[], hasFilters: boolean) => {
    setFilteredByFilter(filtered);
    setHasActiveFilters(hasFilters);
  }, []);

  if (!isClient) {
    return (
      <div className="animate-fade-in">
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
            <span>加载中...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* 搜索和工具栏 */}
      <div className="mb-8 space-y-4">
        {/* 搜索框 */}
        <div className="relative max-w-2xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索充电线品牌、型号、特性..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-200"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <span className="text-xl">×</span>
              </button>
            )}
          </div>
        </div>

        {/* 工具栏 */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-2">
          <div className="flex items-center gap-4">
            {/* 排序选项 */}
            <select
              value={currentSortBy}
              onChange={(e) => handleSortChange(e.target.value as CableSortOption)}
              className="px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="updatedAt">更新时间</option>
              <option value="overallRating">综合评分</option>
              <option value="performanceRating">性能评分</option>
              <option value="experienceRating">体验评分</option>
              <option value="power">功率</option>
              <option value="length">长度</option>
              <option value="weight">重量</option>
              <option value="price">价格</option>
              <option value="alphabetical">首字母</option>
            </select>

            {/* 结果计数 */}
            <div className="text-sm text-gray-600">
              {hasActiveFilters && (
                <span className="text-orange-600 font-medium">已筛选 </span>
              )}
              共 <span className="font-semibold text-gray-900">{sortedCables.length}</span> 款产品
            </div>
          </div>

          {/* 视图切换 */}
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              网格
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              列表
            </button>
          </div>
        </div>
      </div>

      {/* 产品网格/列表 */}
      {sortedCables.length === 0 ? (
        <div className="text-center py-20">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              {searchQuery.trim() ? '未找到匹配的充电线' : '暂无充电线数据'}
            </h3>
            <p className="text-gray-600">
              {searchQuery.trim()
                ? '请尝试其他搜索词或调整筛选条件'
                : '敬请期待更多充电线产品数据'
              }
            </p>
            {searchQuery.trim() && (
              <button
                onClick={() => handleSearchChange('')}
                className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium"
              >
                清除搜索条件
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid'
            ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        )}>
          {sortedCables.map((cable) => (
            <div key={cable.id}>
              {viewMode === 'grid' ? (
                <CableCard cable={cable} />
              ) : (
                <CableListCard cable={cable} />
              )}
            </div>
          ))}
        </div>
      )}

      {/* 返回顶部按钮 */}
      {isClient && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 w-12 h-12 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-200 flex items-center justify-center opacity-0 invisible hover:scale-110"
          id="back-to-top"
        >
          <span className="text-lg">↑</span>
        </button>
      )}
    </div>
  );
}

// 节流函数
function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;

  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}

// 监听滚动显示/隐藏返回顶部按钮
if (typeof window !== 'undefined') {
  const backToTopButton = document.getElementById('back-to-top');
  if (backToTopButton) {
    const toggleBackToTop = () => {
      if (window.scrollY > 300) {
        backToTopButton.classList.remove('opacity-0', 'invisible');
        backToTopButton.classList.add('opacity-100', 'visible');
      } else {
        backToTopButton.classList.add('opacity-0', 'invisible');
        backToTopButton.classList.remove('opacity-100', 'visible');
      }
    };

    window.addEventListener('scroll', toggleBackToTop);
    toggleBackToTop();
  }
}