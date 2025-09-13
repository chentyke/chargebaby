'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, GitCompare, X, Trophy, Plus } from 'lucide-react';
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
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
      // 收起时清空搜索
      setSearchQuery('');
    }
  };

  // 移动端紧凑模式
  if (isMobile && !isSearchExpanded) {
    return (
      <div className={`flex justify-center items-center gap-3 ${className}`}>
        {/* 搜索按钮 */}
        <button 
          onClick={toggleSearch}
          className="flex items-center justify-center w-12 h-12 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-blue-500 hover:text-blue-600 hover:bg-blue-50/30 transition-all duration-300"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* 对比按钮 */}
        <Link href="/compare">
          <div className="flex items-center justify-center w-12 h-12 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-purple-600 hover:text-purple-700 hover:bg-purple-50/30 transition-all duration-300">
            <GitCompare className="w-5 h-5" />
          </div>
        </Link>

        {/* 排行榜按钮 */}
        <Link href="/ranking">
          <div className="flex items-center justify-center w-12 h-12 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-orange-600 hover:text-orange-700 hover:bg-orange-50/30 transition-all duration-300">
            <Trophy className="w-5 h-5" />
          </div>
        </Link>

        {/* 投稿按钮 */}
        <Link href="https://docs.qq.com/form/page/DT1ZzRXZyZEZRTFJU" target="_blank" rel="noopener noreferrer">
          <div className="flex items-center justify-center w-12 h-12 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-green-600 hover:text-green-700 hover:bg-green-50/30 transition-all duration-300">
            <Plus className="w-5 h-5" />
          </div>
        </Link>

        {/* 筛选按钮 - 移动端 */}
        <FilterComponent 
          chargeBabies={chargeBabies} 
          onFilterChange={onFilterChange}
          isMobile={true}
        />
      </div>
    );
  }

  // 桌面端或移动端展开模式
  return (
    <div className={`flex justify-center items-center gap-4 ${className}`}>
      {/* 搜索框 - 灵动岛主体 */}
      <div className="relative">
        <div className={`flex items-center h-12 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 px-4 gap-3 ${
          isMobile ? 'w-64' : 'w-80'
        }`}>
          {isMobile && (
            <button
              onClick={toggleSearch}
              className="p-1 text-blue-500 hover:text-blue-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="搜索充电宝..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 搜索建议 (如果需要) */}
        {searchQuery && (
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-full bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10 z-50 animate-scale-in">
            <div className="p-4 text-sm text-gray-500 text-center">
              搜索 &ldquo;{searchQuery}&rdquo;
            </div>
          </div>
        )}
      </div>

      {/* 功能按钮组 - 仅桌面端显示 */}
      {!isMobile && (
        <div className="flex items-center gap-2">
          {/* 对比按钮 */}
          <Link href="/compare">
            <div className="flex items-center gap-2 h-12 px-4 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-purple-600 hover:text-purple-700 hover:bg-purple-50/30 transition-all duration-300 group">
              <GitCompare className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">对比</span>
            </div>
          </Link>

          {/* 排行榜按钮 */}
          <Link href="/ranking">
            <div className="flex items-center gap-2 h-12 px-4 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-orange-600 hover:text-orange-700 hover:bg-orange-50/30 transition-all duration-300 group">
              <Trophy className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">排行榜</span>
            </div>
          </Link>

          {/* 投稿按钮 */}
          <Link href="https://docs.qq.com/form/page/DT1ZzRXZyZEZRTFJU" target="_blank" rel="noopener noreferrer">
            <div className="flex items-center gap-2 h-12 px-4 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-green-600 hover:text-green-700 hover:bg-green-50/30 transition-all duration-300 group">
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">投稿</span>
            </div>
          </Link>

          {/* 筛选按钮 - 桌面端 */}
          <FilterComponent 
            chargeBabies={chargeBabies} 
            onFilterChange={onFilterChange}
          />
        </div>
      )}
    </div>
  );
}