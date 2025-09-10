'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Search, GitCompare, X } from 'lucide-react';

interface SearchCompareToolbarProps {
  onSearch: (query: string) => void;
  className?: string;
}

export function SearchCompareToolbar({ onSearch, className = '' }: SearchCompareToolbarProps) {
  const [activeButton, setActiveButton] = useState<'none' | 'search' | 'compare'>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      onSearch(searchQuery);
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, onSearch]);

  const handleSearchMouseEnter = () => {
    if (!isMobile) {
      setActiveButton('search');
    }
  };

  const handleCompareMouseEnter = () => {
    if (!isMobile) {
      setActiveButton('compare');
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile && !searchQuery) {
      setActiveButton('none');
    }
  };

  const handleSearchClick = () => {
    if (activeButton === 'search') {
      // 如果已经展开，关闭
      setActiveButton('none');
      setSearchQuery('');
    } else {
      // 展开搜索
      setActiveButton('search');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleInputFocus = () => {
    setActiveButton('search');
  };

  const handleInputBlur = () => {
    if (!searchQuery) {
      setActiveButton('none');
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveButton('none');
  };

  // 计算容器宽度
  const getContainerWidth = () => {
    if (activeButton === 'search') return 400; // 搜索展开
    if (activeButton === 'compare') return 180; // 对比展开
    return 112; // 两个图标按钮
  };

  return (
    <div className={`flex justify-center ${className}`}>
      <div 
        className="relative flex items-center gap-2 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 transition-all duration-500 ease-out"
        style={{ 
          width: getContainerWidth(),
          height: 56,
          padding: '4px'
        }}
        onMouseLeave={handleMouseLeave}
      >
        {/* 搜索按钮/输入框 */}
        <div className="relative flex-1 h-full">
          {activeButton === 'search' ? (
            // 展开的搜索输入框
            <div className="flex items-center h-full bg-blue-50/50 rounded-xl border border-blue-200/50">
              <div className="pl-4 pr-2">
                <Search className="w-5 h-5 text-blue-500" />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索充电宝..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="flex-1 h-full bg-transparent text-gray-900 placeholder-gray-500 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            // 搜索图标按钮
            <button
              onClick={handleSearchClick}
              onMouseEnter={handleSearchMouseEnter}
              className="w-full h-full flex items-center justify-center bg-white/50 hover:bg-blue-50 rounded-xl border border-transparent hover:border-blue-200/50 transition-all duration-300 group"
            >
              <Search className="w-5 h-5 text-gray-500 group-hover:text-blue-500 transition-colors" />
            </button>
          )}
        </div>

        {/* 对比按钮 */}
        <div className="relative h-full">
          {activeButton === 'compare' ? (
            // 展开的对比按钮
            <Link href="/compare">
              <div className="flex items-center h-full px-4 bg-purple-50/50 rounded-xl border border-purple-200/50 text-purple-600 hover:text-purple-700 transition-all duration-300 whitespace-nowrap">
                <GitCompare className="w-5 h-5 mr-2" />
                <span className="text-sm font-medium">对比</span>
              </div>
            </Link>
          ) : (
            // 对比图标按钮
            <Link href="/compare">
              <button
                onMouseEnter={handleCompareMouseEnter}
                className="w-12 h-full flex items-center justify-center bg-white/50 hover:bg-purple-50 rounded-xl border border-transparent hover:border-purple-200/50 transition-all duration-300 group"
              >
                <GitCompare className="w-5 h-5 text-gray-500 group-hover:text-purple-500 transition-colors" />
              </button>
            </Link>
          )}
        </div>
      </div>

      {/* 搜索建议 (如果需要) */}
      {activeButton === 'search' && searchQuery && (
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 w-80 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10 z-50 animate-scale-in">
          <div className="p-4 text-sm text-gray-500 text-center">
            搜索 &ldquo;{searchQuery}&rdquo;
          </div>
        </div>
      )}
    </div>
  );
}