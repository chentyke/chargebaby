'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { ChargeBaby, SortOption } from '@/types/chargebaby';
import { ChargeBabyCard } from '@/components/charge-baby-card';
import { ChargeBabyListCard } from '@/components/charge-baby-list-card';
import { SearchCompareToolbar, ViewMode } from '@/components/search-compare-toolbar';
import { useImagePreloader } from '@/hooks/useImagePreloader';
import { cn } from '@/lib/utils';
import { getStoredViewMode, setStoredViewMode, getStoredScrollPosition } from '@/utils/view-mode-storage';
import { saveSearchState, getStoredSearchState } from '@/utils/search-state-storage';

interface SearchableProductsGridProps {
  chargeBabies: ChargeBaby[];
  initialViewMode?: 'grid' | 'list';
}

export function SearchableProductsGrid({ chargeBabies, initialViewMode }: SearchableProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredByFilter, setFilteredByFilter] = useState<ChargeBaby[]>(chargeBabies);
  const [currentSortBy, setCurrentSortBy] = useState<SortOption>('updatedAt');
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isClient, setIsClient] = useState(false);
  const [scrollRestored, setScrollRestored] = useState(false);

  const pathname = usePathname();

  // 启用智能图片预加载
  useImagePreloader(chargeBabies, true);

  const filteredProducts = useMemo(() => {
    const baseProducts = filteredByFilter;
    
    if (!searchQuery.trim()) {
      return baseProducts;
    }

    // 自动分词：按空格分隔搜索查询
    const keywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
    
    return baseProducts.filter((chargeBaby) => {
      const searchFields = [
        chargeBaby.title,
        chargeBaby.displayName,
        chargeBaby.brand,
        chargeBaby.model,
        chargeBaby.subtitle,
        ...(Array.isArray(chargeBaby.tags) ? chargeBaby.tags : [])
      ].filter(Boolean);

      // 将所有搜索字段合并成一个字符串
      const combinedText = searchFields
        .map(field => field?.toString().toLowerCase())
        .join(' ');

      // 所有关键词都必须在合并文本中找到（AND 逻辑）
      return keywords.every(keyword => combinedText.includes(keyword));
    });
  }, [filteredByFilter, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // 保存搜索状态到 localStorage
    saveSearchState(query, pathname);
  };

  const handleFilterChange = useCallback((filteredBabies: ChargeBaby[], sortBy: SortOption, hasFilters: boolean) => {
    setFilteredByFilter(filteredBabies);
    setCurrentSortBy(sortBy);
    setHasActiveFilters(hasFilters);
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    setStoredViewMode(mode); // 持久化保存
  }, []);

  // 客户端初始化：优先使用 URL 参数，否则从 localStorage 恢复视图模式和搜索状态
  useEffect(() => {
    setIsClient(true);
    const finalViewMode = initialViewMode || getStoredViewMode();
    setViewMode(finalViewMode);
    
    // 如果 URL 参数指定了视图模式，也要保存到 localStorage
    if (initialViewMode) {
      setStoredViewMode(initialViewMode);
    }

    // 恢复搜索状态
    const savedSearchState = getStoredSearchState(pathname);
    if (savedSearchState && savedSearchState.searchQuery) {
      setSearchQuery(savedSearchState.searchQuery);
    }
  }, [initialViewMode, pathname]);

  // 当chargeBabies变化时更新筛选状态
  useEffect(() => {
    setFilteredByFilter(chargeBabies);
  }, [chargeBabies]);

  // 滚动位置恢复 - 在组件挂载和视图模式确定后执行
  useEffect(() => {
    if (!isClient || !viewMode || scrollRestored) {
      return;
    }

    // 延迟恢复滚动位置，确保DOM已渲染
    const restoreScroll = () => {
      const savedScrollY = getStoredScrollPosition(pathname, viewMode);
      if (savedScrollY !== null) {
        window.scrollTo({
          top: savedScrollY,
          behavior: 'auto'
        });
        setScrollRestored(true);
      }
    };

    // 使用setTimeout确保在所有渲染完成后执行
    const timeoutId = setTimeout(restoreScroll, 100);
    
    return () => clearTimeout(timeoutId);
  }, [isClient, viewMode, pathname, scrollRestored]);

  return (
    <div className="space-y-8">
      {/* 搜索对比工具栏 - 与标题融合 */}
      <SearchCompareToolbar
        onSearch={handleSearch}
        chargeBabies={chargeBabies}
        onFilterChange={handleFilterChange}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        className="mb-8 animate-slide-up"
      />

      {/* 搜索结果提示 */}
      {searchQuery && (
        <div className="text-center space-y-2 animate-fade-in">
          <div className="text-sm text-gray-500">
            找到 <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 个结果
          </div>
          {filteredProducts.length === 0 && (
            <div className="text-sm text-gray-400">
              没有找到匹配的充电宝，请尝试其他关键词
            </div>
          )}
        </div>
      )}

      {/* 产品展示区域 */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((chargeBaby, index) => (
              <ChargeBabyCard
                key={chargeBaby.id}
                chargeBaby={chargeBaby}
                index={index}
                sortBy={currentSortBy}
                hasActiveFilters={hasActiveFilters}
                currentViewMode={viewMode}
                currentSearchQuery={searchQuery}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm animate-fade-in">
            {/* 桌面端：两列布局，移动端：单列布局 */}
            <div className="md:grid md:grid-cols-2">
              {filteredProducts.map((chargeBaby, index) => {
                const isLastItem = index === filteredProducts.length - 1;
                const isSecondLastItem = index === filteredProducts.length - 2;
                
                return (
                  <ChargeBabyListCard
                    key={chargeBaby.id}
                    chargeBaby={chargeBaby}
                    index={index}
                    sortBy={currentSortBy}
                    hasActiveFilters={hasActiveFilters}
                    currentViewMode={viewMode}
                    currentSearchQuery={searchQuery}
                    className={cn(
                      // 移动端：除最后一项外都有下边框
                      !isLastItem && "border-b border-gray-200",
                      // 桌面端：右列（奇数索引，从0开始计数）添加左边框
                      index % 2 === 1 && "md:border-l md:border-l-gray-200",
                      // 桌面端：非最后一行的项目都有下边框
                      index < filteredProducts.length - 2 && "md:border-b md:border-b-gray-200"
                    )}
                  />
                );
              })}
            </div>
          </div>
        )
      ) : searchQuery ? (
        <div className="text-center py-20">
          <div className="space-y-4 animate-scale-in">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-600">
              <div className="text-lg font-medium mb-2">未找到相关结果</div>
              <div className="text-sm">请尝试使用不同的关键词搜索</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-600">暂无产品数据</div>
      )}
    </div>
  );
}