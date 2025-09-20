'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, GitCompare, X, Trophy, Plus, Filter } from 'lucide-react';
import { FilterComponent } from './filter-component';
import { ChargeBaby, SortOption } from '@/types/chargebaby';

interface SearchCompareToolbarProps {
  onSearch: (query: string) => void;
  chargeBabies: ChargeBaby[];
  onFilterChange: (filteredBabies: ChargeBaby[], sortBy: SortOption, hasFilters: boolean) => void;
  className?: string;
}

export function SearchCompareToolbar({ onSearch, chargeBabies, onFilterChange, className = '' }: SearchCompareToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);

  const clearSearch = () => {
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const toggleSearch = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (!isSearchExpanded) {
      // 展开后自动聚焦输入框
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // 收起时清空搜索和筛选
      setSearchQuery('');
      setIsFilterExpanded(false);
    }
  };

  const toggleFilter = () => {
    setIsFilterExpanded(!isFilterExpanded);
  };

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  // 确保客户端渲染后再显示移动端UI
  if (!isClient) {
    return (
      <div className={`relative ${className}`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 px-4 min-w-max">
              <button className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-blue-50/40 backdrop-blur-2xl rounded-2xl border border-blue-200/50 text-blue-600 transition-all duration-300 flex-shrink-0">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 移动端紧凑模式
  if (isMobile && !isSearchExpanded) {
    return (
      <div className={`relative ${className}`}>

        {/* 水平滚动容器 */}
        <div className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 px-4 min-w-max">
              {/* 搜索按钮 */}
              <button 
                onClick={toggleSearch}
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-blue-50/40 backdrop-blur-2xl rounded-2xl border border-blue-200/50 text-blue-600 hover-hover:hover:text-blue-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-blue-100/80 hover-hover:hover:via-blue-100/60 hover-hover:hover:to-blue-100/40 transition-all duration-300 flex-shrink-0"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* 对比按钮 */}
              <button 
                onClick={() => handleNavigation('/compare')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-purple-50/40 backdrop-blur-2xl rounded-2xl border border-purple-200/50 text-purple-600 hover-hover:hover:text-purple-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-purple-100/80 hover-hover:hover:via-purple-100/60 hover-hover:hover:to-purple-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0"
              >
                <GitCompare className="w-5 h-5" />
                <span className="text-sm font-medium">对比</span>
              </button>

              {/* 排行榜按钮 */}
              <button 
                onClick={() => handleNavigation('/ranking')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-orange-50/40 backdrop-blur-2xl rounded-2xl border border-orange-200/50 text-orange-600 hover-hover:hover:text-orange-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-orange-100/80 hover-hover:hover:via-orange-100/60 hover-hover:hover:to-orange-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0"
              >
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">排行榜</span>
              </button>

              {/* 投稿按钮 */}
              <a 
                href="https://powerbank.wiki/submit"
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-green-50/80 via-green-50/60 to-green-50/40 backdrop-blur-2xl rounded-2xl border border-green-200/50 text-green-600 hover-hover:hover:text-green-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-green-100/80 hover-hover:hover:via-green-100/60 hover-hover:hover:to-green-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">投稿</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 桌面端或移动端展开模式
  return (
    <div className={`${className}`} ref={toolbarRef}>
      {/* 移动端展开模式 */}
      {isMobile ? (
        <div className="space-y-3">
          {/* 搜索框容器 */}
          <div className="relative">
            <div className="flex items-center h-12 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-blue-50/40 backdrop-blur-2xl rounded-2xl border border-blue-200/50 px-4 gap-3 w-full animate-scale-in">
              <button
                onClick={toggleSearch}
                className="p-1 text-blue-600 hover-hover:hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
              <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索充电宝..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-blue-900 placeholder-blue-500/70 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-blue-400 hover-hover:hover:text-blue-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* 筛选按钮 */}
              <button
                onClick={toggleFilter}
                className="flex items-center justify-center w-8 h-8 text-blue-600 hover-hover:hover:text-blue-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-blue-100/50 hover-hover:hover:via-blue-100/30 hover-hover:hover:to-blue-100/20 rounded-lg transition-all duration-300 flex-shrink-0"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* 搜索建议 */}
            {searchQuery && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10 z-50 animate-scale-in">
                <div className="p-4 text-sm text-gray-500 text-center">
                  搜索 &ldquo;{searchQuery}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* 筛选组件展开区域 */}
          {isFilterExpanded && (
            <div className="animate-slide-down">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="min-w-max">
                  <FilterComponent 
                    chargeBabies={chargeBabies} 
                    onFilterChange={onFilterChange}
                    isMobile={true}
                    isInline={true}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* 桌面端模式 */
        <div className="flex justify-center items-center gap-4">
          {/* 搜索框 - 灵动岛主体 */}
          <div className="relative">
            <div className="flex items-center h-12 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-blue-50/40 backdrop-blur-2xl rounded-2xl border border-blue-200/50 shadow-lg shadow-black/5 px-4 gap-3 w-80">
              <Search className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索充电宝..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-blue-900 placeholder-blue-500/70 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-blue-400 hover-hover:hover:text-blue-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 搜索建议 */}
            {searchQuery && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10 z-50 animate-scale-in">
                <div className="p-4 text-sm text-gray-500 text-center">
                  搜索 &ldquo;{searchQuery}&rdquo;
                </div>
              </div>
            )}
          </div>

          {/* 功能按钮组 */}
          <div className="flex items-center gap-2">
            {/* 对比按钮 */}
            <Link 
              href="/compare"
              className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 text-purple-600 hover-hover:hover:text-purple-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-purple-50/40 hover-hover:hover:via-purple-50/30 hover-hover:hover:to-purple-50/20 transition-all duration-300 group"
            >
              <GitCompare className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">对比</span>
            </Link>

            {/* 排行榜按钮 */}
            <Link 
              href="/ranking"
              className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 text-orange-600 hover-hover:hover:text-orange-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-orange-50/40 hover-hover:hover:via-orange-50/30 hover-hover:hover:to-orange-50/20 transition-all duration-300 group"
            >
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">排行榜</span>
            </Link>

            {/* 投稿按钮 */}
            <a 
              href="https://powerbank.wiki/submit"
              className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 text-green-600 hover-hover:hover:text-green-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-green-50/40 hover-hover:hover:via-green-50/30 hover-hover:hover:to-green-50/20 transition-all duration-300 group"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">投稿</span>
            </a>

            {/* 筛选按钮 - 桌面端 */}
            <FilterComponent 
              chargeBabies={chargeBabies} 
              onFilterChange={onFilterChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}