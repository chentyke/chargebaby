'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, GitCompare, X, Trophy, Plus, Filter, Clock, Hash, MessageCircle, Grid3X3, List } from 'lucide-react';
import { FilterComponent } from './filter-component';
import { ChargeBaby, SortOption } from '@/types/chargebaby';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { 
  getSearchHistory, 
  addSearchHistory, 
  removeSearchHistory, 
  type SearchHistoryItem 
} from '@/utils/search-history';
import { 
  generateSearchTags, 
  applyTagFilter, 
  getTagTypeLabel,
  type SearchTag 
} from '@/utils/search-tags';
import { isAnyFieldMatch } from '@/utils/pinyin-matcher';

import type { ViewMode } from '@/utils/view-mode-storage';

// Re-export ViewMode for other components
export type { ViewMode };

interface SearchCompareToolbarProps {
  onSearch: (query: string) => void;
  chargeBabies: ChargeBaby[];
  onFilterChange: (filteredBabies: ChargeBaby[], sortBy: SortOption, hasFilters: boolean) => void;
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  className?: string;
}

export function SearchCompareToolbar({ onSearch, chargeBabies, onFilterChange, viewMode = 'grid', onViewModeChange, className = '' }: SearchCompareToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [searchTags, setSearchTags] = useState<SearchTag[]>([]);
  const [activeFilter, setActiveFilter] = useState<SearchTag | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // 搜索建议逻辑
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      return [];
    }

    const query = searchQuery.trim();
    const filtered = chargeBabies.filter((chargeBaby) => {
      const searchFields = [
        chargeBaby.title,
        chargeBaby.displayName,
        chargeBaby.brand,
        chargeBaby.model,
        chargeBaby.subtitle,
        ...(Array.isArray(chargeBaby.tags) ? chargeBaby.tags : [])
      ].filter(Boolean);

      return isAnyFieldMatch(searchFields, query);
    });

    // 按照匹配度排序：优先显示标题和显示名称匹配的产品
    return filtered.sort((a, b) => {
      const aTitle = (a.title || '').toLowerCase();
      const bTitle = (b.title || '').toLowerCase();
      const aDisplayName = (a.displayName || '').toLowerCase();
      const bDisplayName = (b.displayName || '').toLowerCase();
      
      // 如果标题开头匹配，优先级更高
      if (aTitle.startsWith(query) && !bTitle.startsWith(query)) return -1;
      if (!aTitle.startsWith(query) && bTitle.startsWith(query)) return 1;
      
      // 如果显示名称开头匹配，优先级更高
      if (aDisplayName.startsWith(query) && !bDisplayName.startsWith(query)) return -1;
      if (!aDisplayName.startsWith(query) && bDisplayName.startsWith(query)) return 1;
      
      // 按综合评分排序
      return b.overallRating - a.overallRating;
    }).slice(0, 5); // 限制显示5个建议
  }, [chargeBabies, searchQuery]);

  useEffect(() => {
    setIsClient(true);
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    // 初始化搜索历史记录
    setSearchHistory(getSearchHistory());
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);


  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);

  // 处理搜索建议的显示/隐藏
  useEffect(() => {
    setShowSuggestions(searchQuery.length >= 1 && searchSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);
    
    // 生成搜索标签
    if (searchQuery.length >= 1) {
      setSearchTags(generateSearchTags(searchQuery, chargeBabies));
    } else {
      setSearchTags([]);
    }
  }, [searchQuery, searchSuggestions, chargeBabies]);

  // 点击外部区域和页面滚动时隐藏建议
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    const handleScroll = (event: Event) => {
      // 只在搜索建议框外部滚动时隐藏建议
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    const handleTouchStart = (event: TouchEvent) => {
      // 只在搜索建议框和输入框外部触摸时隐藏建议
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setShowHistory(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('scroll', handleScroll, true);
    document.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('scroll', handleScroll, true);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, []);

  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setShowHistory(false);
    setSelectedSuggestionIndex(-1);
    setSearchTags([]);
    inputRef.current?.focus();
  };

  // 处理键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        if (showSuggestions && searchSuggestions.length > 0) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < searchSuggestions.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        if (showSuggestions && searchSuggestions.length > 0) {
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev > 0 ? prev - 1 : searchSuggestions.length - 1
          );
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (showSuggestions && selectedSuggestionIndex >= 0 && selectedSuggestionIndex < searchSuggestions.length) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        } else {
          handleSearchSubmit();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setShowHistory(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (chargeBaby: ChargeBaby) => {
    router.push(`/${encodeURIComponent(chargeBaby.model)}`);
    setSearchQuery(chargeBaby.displayName || chargeBaby.title);
    setShowSuggestions(false);
    setShowHistory(false);
    setSelectedSuggestionIndex(-1);
  };

  // 处理历史记录点击
  const handleHistoryClick = (historyItem: SearchHistoryItem) => {
    setSearchQuery(historyItem.query);
    addSearchHistory(historyItem.query);
    setSearchHistory(getSearchHistory());
    setShowHistory(false);
    setShowSuggestions(false);
  };

  // 处理删除历史记录
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeSearchHistory(id);
    setSearchHistory(getSearchHistory());
  };

  // 处理搜索标签点击
  const handleTagClick = (tag: SearchTag) => {
    const filteredBabies = applyTagFilter(chargeBabies, tag);
    onFilterChange(filteredBabies, 'overallRating', true);
    // 清空搜索框，避免协议名称进行二次筛选
    setSearchQuery('');
    // 设置激活的筛选
    setActiveFilter(tag);
    addSearchHistory(tag.label);
    setSearchHistory(getSearchHistory());
    setShowSuggestions(false);
    setShowHistory(false);
  };

  // 处理输入框焦点
  const handleInputFocus = () => {
    if (searchQuery.length >= 1 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    } else if (searchQuery.length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  // 处理输入框失去焦点
  const handleInputBlur = () => {
    // 延迟隐藏建议，以便用户能够点击建议项
    setTimeout(() => {
      setShowSuggestions(false);
      setShowHistory(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // 处理搜索提交
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      setSearchHistory(getSearchHistory());
      setShowSuggestions(false);
      setShowHistory(false);
    }
  };

  // 处理清除筛选
  const handleClearFilter = () => {
    setActiveFilter(null);
    onFilterChange(chargeBabies, 'overallRating', false);
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

  // 高亮匹配文本的辅助函数
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="bg-yellow-200 text-yellow-800 rounded px-0.5">
          {part}
        </span>
      ) : part
    );
  };

  // 渲染搜索建议组件
  const renderSearchSuggestions = () => {
    const hasHistory = showHistory && searchHistory.length > 0;
    const hasSuggestions = showSuggestions && searchSuggestions.length > 0;
    const hasTags = showSuggestions && searchTags.length > 0 && searchQuery.length >= 1;
    
    if (!hasHistory && !hasSuggestions && !hasTags) return null;

    return (
      <div 
        ref={suggestionsRef}
        className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10 z-50 animate-scale-in overflow-hidden"
      >
        <div className="py-2 max-h-80 overflow-y-auto">
          {/* 智能标签建议 - 最高优先级 */}
          {hasTags && (
            <>
              <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                <Hash className="w-3 h-3" />
                <span>智能筛选</span>
              </div>
              {searchTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleTagClick(tag)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50/80 transition-all duration-200 text-left"
                >
                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                    tag.type === 'brand' ? 'bg-blue-500' : 
                    tag.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {highlightText(tag.label, searchQuery)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {getTagTypeLabel(tag.type)} · {tag.count} 个产品
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* 产品建议 - 第二优先级 */}
          {hasSuggestions && (
            <>
              {hasTags && <div className="border-t border-gray-100" />}
              <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                <Search className="w-3 h-3" />
                <span>产品建议</span>
              </div>
              {searchSuggestions.map((chargeBaby, index) => (
                <button
                  key={chargeBaby.id}
                  onClick={() => handleSuggestionClick(chargeBaby)}
                  className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-all duration-200 text-left ${
                    selectedSuggestionIndex === index ? 'bg-blue-50/80 border-l-2 border-blue-400' : ''
                  }`}
                >
                  {/* 产品图片 */}
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                    {chargeBaby.imageUrl ? (
                      <Image
                        src={`/api/image-proxy?url=${encodeURIComponent(chargeBaby.imageUrl)}&size=thumbnail`}
                        alt={chargeBaby.displayName || chargeBaby.title}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                        <Search className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  {/* 产品信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {highlightText(chargeBaby.displayName || chargeBaby.title, searchQuery)}
                    </div>
                  </div>
                  
                  {/* 价格信息 */}
                  <div className="flex-shrink-0">
                    <div className="text-sm font-medium text-gray-900">
                      ¥{chargeBaby.price}
                    </div>
                  </div>
                </button>
              ))}
            </>
          )}

          {/* 搜索历史记录 - 最低优先级 */}
          {hasHistory && (
            <>
              {(hasSuggestions || hasTags) && <div className="border-t border-gray-100" />}
              <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-gray-500 border-b border-gray-100">
                <Clock className="w-3 h-3" />
                <span>搜索历史</span>
              </div>
              {searchHistory.slice(0, 5).map((historyItem) => (
                <div
                  key={historyItem.id}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50/80 transition-all duration-200 text-left group cursor-pointer"
                  onClick={() => handleHistoryClick(historyItem)}
                >
                  <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {historyItem.query}
                  </span>
                  <button
                    onClick={(e) => handleDeleteHistory(historyItem.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-all duration-200 flex-shrink-0"
                  >
                    <X className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
              ))}
            </>
          )}
          
          {/* 搜索提示底部 */}
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex items-center justify-between">
            <span>按 ↵ 搜索 · 按 ↑↓ 导航 · 按 ESC 关闭</span>
            {hasSuggestions && <span>{searchSuggestions.length} 个结果</span>}
          </div>
        </div>
      </div>
    );
  };

  // 确保客户端渲染后再显示移动端UI
  if (!isClient) {
    return (
      <div className={`relative ${className}`}>
        <div className="overflow-hidden">
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 px-4 min-w-max">
              <button className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50/80 via-gray-50/60 to-gray-50/40 backdrop-blur-2xl rounded-2xl border border-gray-200/50 text-gray-600 transition-all duration-300 flex-shrink-0">
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
                className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50/80 via-gray-50/60 to-gray-50/40 backdrop-blur-2xl rounded-2xl border border-gray-200/50 text-gray-600 hover-hover:hover:text-gray-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-gray-100/80 hover-hover:hover:via-gray-100/60 hover-hover:hover:to-gray-100/40 transition-all duration-300 flex-shrink-0 touch-manipulation active:scale-95 active:bg-gray-100/60"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* 视图切换按钮 - 移动端动态图标 */}
              {onViewModeChange && (
                <button
                  onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
                  className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gray-50/80 via-gray-50/60 to-gray-50/40 backdrop-blur-2xl rounded-2xl border border-gray-200/50 text-gray-600 hover-hover:hover:text-gray-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-gray-100/80 hover-hover:hover:via-gray-100/60 hover-hover:hover:to-gray-100/40 transition-all duration-300 flex-shrink-0 touch-manipulation active:scale-95 active:bg-gray-100/60 group"
                >
                  <div className="relative w-5 h-5">
                    {/* 网格图标 */}
                    <Grid3X3 
                      className={cn(
                        "w-5 h-5 absolute top-0 left-0 transition-all duration-300 transform",
                        viewMode === 'grid' 
                          ? "opacity-100 rotate-0 scale-100" 
                          : "opacity-0 rotate-180 scale-75"
                      )} 
                    />
                    {/* 列表图标 */}
                    <List 
                      className={cn(
                        "w-5 h-5 absolute top-0 left-0 transition-all duration-300 transform",
                        viewMode === 'list' 
                          ? "opacity-100 rotate-0 scale-100" 
                          : "opacity-0 -rotate-180 scale-75"
                      )} 
                    />
                  </div>
                </button>
              )}

              {/* 激活筛选显示 - 移动端紧凑模式 */}
              {activeFilter && (
                <div className="flex items-center gap-2 h-12 px-3 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 animate-scale-in flex-shrink-0">
                  <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                    activeFilter.type === 'brand' ? 'bg-blue-500' : 
                    activeFilter.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-sm text-gray-700 whitespace-nowrap max-w-20 truncate">
                    {activeFilter.label}
                  </span>
                  <button
                    onClick={handleClearFilter}
                    className="p-1 text-gray-400 hover-hover:hover:text-gray-600 hover-hover:hover:bg-gray-100/50 rounded transition-all duration-200 flex-shrink-0 touch-manipulation"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}

              {/* 微信群按钮 */}
              <button 
                onClick={() => handleNavigation('/wechat')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-green-50/80 via-green-50/60 to-green-50/40 backdrop-blur-2xl rounded-2xl border border-green-200/50 text-green-600 hover-hover:hover:text-green-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-green-100/80 hover-hover:hover:via-green-100/60 hover-hover:hover:to-green-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0 active:scale-95 active:bg-green-100/60"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">微信群</span>
              </button>

              {/* 对比按钮 */}
              <button 
                onClick={() => handleNavigation('/compare')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-purple-50/40 backdrop-blur-2xl rounded-2xl border border-purple-200/50 text-purple-600 hover-hover:hover:text-purple-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-purple-100/80 hover-hover:hover:via-purple-100/60 hover-hover:hover:to-purple-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0 active:scale-95 active:bg-purple-100/60"
              >
                <GitCompare className="w-5 h-5" />
                <span className="text-sm font-medium">对比</span>
              </button>

              {/* 排行榜按钮 */}
              <button 
                onClick={() => handleNavigation('/ranking')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-orange-50/80 via-orange-50/60 to-orange-50/40 backdrop-blur-2xl rounded-2xl border border-orange-200/50 text-orange-600 hover-hover:hover:text-orange-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-orange-100/80 hover-hover:hover:via-orange-100/60 hover-hover:hover:to-orange-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0 active:scale-95 active:bg-orange-100/60"
              >
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">排行榜</span>
              </button>

              {/* 投稿按钮 */}
              <button 
                onClick={() => handleNavigation('/submit')}
                className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-blue-50/80 via-blue-50/60 to-blue-50/40 backdrop-blur-2xl rounded-2xl border border-blue-200/50 text-blue-600 hover-hover:hover:text-blue-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-blue-100/80 hover-hover:hover:via-blue-100/60 hover-hover:hover:to-blue-100/40 transition-all duration-300 touch-manipulation whitespace-nowrap flex-shrink-0 active:scale-95 active:bg-blue-100/60"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">投稿</span>
              </button>
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
            <div className="flex items-center h-12 bg-gradient-to-br from-gray-50/80 via-gray-50/60 to-gray-50/40 backdrop-blur-2xl rounded-2xl border border-gray-200/50 px-4 gap-3 w-full animate-scale-in">
              <button
                onClick={toggleSearch}
                className="p-1 text-gray-600 hover-hover:hover:text-gray-600 transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
              <Search className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索充电宝..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500/70 focus:outline-none text-sm"
              />
              {/* 筛选按钮 */}
              <button
                onClick={toggleFilter}
                className="flex items-center justify-center w-8 h-8 text-gray-600 hover-hover:hover:text-gray-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-gray-100/50 hover-hover:hover:via-gray-100/30 hover-hover:hover:to-gray-100/20 rounded-lg transition-all duration-300 flex-shrink-0"
              >
                <Filter className="w-4 h-4" />
              </button>
            </div>

            {/* 搜索建议 */}
            {renderSearchSuggestions()}
          </div>

          {/* 激活筛选显示 - 移动端 */}
          {activeFilter && (
            <div className="flex items-center gap-2 p-3 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 animate-scale-in">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                activeFilter.type === 'brand' ? 'bg-blue-500' : 
                activeFilter.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
              }`} />
              <span className="text-sm text-gray-700 flex-1">
                {getTagTypeLabel(activeFilter.type)}: {activeFilter.label}
              </span>
              <button
                onClick={handleClearFilter}
                className="p-1 text-gray-400 hover-hover:hover:text-gray-600 hover-hover:hover:bg-gray-100/50 rounded transition-all duration-200"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

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
            <div className="flex items-center h-12 bg-gradient-to-br from-gray-50/80 via-gray-50/60 to-gray-50/40 backdrop-blur-2xl rounded-2xl border border-gray-200/50 shadow-lg shadow-black/5 px-4 gap-3 w-80">
              <Search className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索充电宝..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="flex-1 bg-transparent text-gray-900 placeholder-gray-500/70 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-gray-400 hover-hover:hover:text-gray-600 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* 搜索建议 */}
            {renderSearchSuggestions()}
          </div>

          {/* 激活筛选显示 - 桌面端右侧 */}
          {activeFilter && (
            <div className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 animate-scale-in">
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                activeFilter.type === 'brand' ? 'bg-blue-500' : 
                activeFilter.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
              }`} />
              <span className="text-sm text-gray-700 whitespace-nowrap">
                {getTagTypeLabel(activeFilter.type)}: {activeFilter.label}
              </span>
              <button
                onClick={handleClearFilter}
                className="p-1 text-gray-400 hover-hover:hover:text-gray-600 hover-hover:hover:bg-gray-100/50 rounded transition-all duration-200 ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* 视图切换按钮 - 桌面端胶囊型 */}
          {onViewModeChange && (
            <div className="flex items-center h-12 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 px-1">
              <button
                onClick={() => onViewModeChange('grid')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  viewMode === 'grid'
                    ? "bg-gray-100 shadow-sm text-gray-900"
                    : "text-gray-500 hover-hover:hover:text-gray-700 hover-hover:hover:bg-gray-50"
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  viewMode === 'list'
                    ? "bg-gray-100 shadow-sm text-gray-900"
                    : "text-gray-500 hover-hover:hover:text-gray-700 hover-hover:hover:bg-gray-50"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* 功能按钮组 */}
          <div className="flex items-center gap-2">
            {/* 微信群按钮 */}
            <Link 
              href="/wechat"
              className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 text-green-600 hover-hover:hover:text-green-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-green-50/40 hover-hover:hover:via-green-50/30 hover-hover:hover:to-green-50/20 transition-all duration-300 group"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">微信群</span>
            </Link>

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
            <Link 
              href="/submit"
              className="flex items-center gap-2 h-12 px-4 bg-gradient-to-br from-white/95 via-white/90 to-white/80 backdrop-blur-2xl rounded-2xl border border-white/50 shadow-lg shadow-black/5 text-blue-600 hover-hover:hover:text-blue-700 hover-hover:hover:bg-gradient-to-br hover-hover:hover:from-blue-50/40 hover-hover:hover:via-blue-50/30 hover-hover:hover:to-blue-50/20 transition-all duration-300 group"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium whitespace-nowrap">投稿</span>
            </Link>

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