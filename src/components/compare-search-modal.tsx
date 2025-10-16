'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, ArrowLeft } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { ChargeBabyCard } from '@/components/charge-baby-card';
import { cn } from '@/lib/utils';
import { NotionImage } from '@/components/notion-image';
import {
  addSearchHistory,
} from '@/utils/search-history';
import {
  generateSearchTags,
  getTagTypeLabel,
  applyTagFilter,
  type SearchTag
} from '@/utils/search-tags';
import { isAnyFieldMatch } from '@/utils/pinyin-matcher';

interface CompareSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ChargeBaby) => void;
  chargeBabies: ChargeBaby[];
  excludedIds?: string[];
  position?: number;
}

// 简化的充电宝卡片组件，用于搜索弹窗
function SimpleChargeBabyCard({
  product,
  onClick,
  searchQuery
}: {
  product: ChargeBaby;
  onClick: () => void;
  searchQuery: string;
}) {
  const { displayName, title, imageUrl } = product;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  return (
    <div
      className="group relative rounded-2xl overflow-hidden border cursor-pointer bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md transition-all duration-200 touch-manipulation active:scale-[0.98]"
      onClick={handleCardClick}
    >
      {/* 图片容器 */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-50">
        {/* 产品图片 */}
        {imageUrl ? (
          <NotionImage
            src={imageUrl}
            alt={title}
            fill
            className="object-contain px-2 pb-2 -mt-4 transition-all duration-200 hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
            loading="lazy"
            placeholder="blur"
            blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmYWZiIi8+PC9zdmc+"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Search className="w-16 h-16 text-gray-400/60" />
          </div>
        )}

  
        {/* 文字叠加区域 */}
        <div className="absolute inset-x-0 bottom-0 p-4 pb-5 flex items-end bg-white/90">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 transition-all duration-200">
            {displayName || title}
          </h3>
        </div>
      </div>
    </div>
  );
}

export function CompareSearchModal({
  isOpen,
  onClose,
  onSelect,
  chargeBabies,
  excludedIds = [],
  position = 1
}: CompareSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<ChargeBaby[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchTags, setSearchTags] = useState<SearchTag[]>([]);
  const [activeTag, setActiveTag] = useState<SearchTag | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // 检测设备类型
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 搜索建议逻辑
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 1) {
      return [];
    }

    const query = searchQuery.trim();
    const availableProducts = chargeBabies.filter(product =>
      product.model !== 'WeChat' && !excludedIds.includes(product.id)
    );

    const filtered = availableProducts.filter((chargeBaby) => {
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
  }, [chargeBabies, searchQuery, excludedIds]);

  // 搜索过滤逻辑
  useEffect(() => {
    // 如果有活跃的标签筛选，不执行搜索过滤
    if (activeTag) {
      return;
    }

    // 过滤排除的产品
    const availableProducts = chargeBabies.filter(product =>
      product.model !== 'WeChat' && !excludedIds.includes(product.id)
    );

    if (!searchQuery.trim()) {
      setFilteredProducts(availableProducts);
      return;
    }

    const keywords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);

    const filtered = availableProducts.filter((product) => {
      const searchFields = [
        product.title,
        product.displayName,
        product.brand,
        product.model,
        product.subtitle,
        ...(Array.isArray(product.tags) ? product.tags : [])
      ].filter(Boolean);

      const combinedText = searchFields
        .map(field => field?.toString().toLowerCase())
        .join(' ');

      return keywords.every(keyword => combinedText.includes(keyword));
    });

    setFilteredProducts(filtered);
  }, [searchQuery, chargeBabies, excludedIds, activeTag]);

  // 处理搜索建议的显示/隐藏
  useEffect(() => {
    setShowSuggestions(searchQuery.length >= 1 && searchSuggestions.length > 0);
    setSelectedSuggestionIndex(-1);

    // 生成搜索标签
    if (searchQuery.length >= 1) {
      const availableProducts = chargeBabies.filter(product =>
        product.model !== 'WeChat' && !excludedIds.includes(product.id)
      );
      setSearchTags(generateSearchTags(searchQuery, availableProducts));
    } else {
      setSearchTags([]);
    }
  }, [searchQuery, searchSuggestions, chargeBabies, excludedIds]);

  // 自动聚焦搜索框
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setSearchTags([]);
      setActiveTag(null);
    }
  }, [isOpen]);

  // 点击背景关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // 处理搜索建议点击外部区域
    const handleSuggestionsClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('mousedown', handleSuggestionsClickOutside);
      // 防止背景滚动
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousedown', handleSuggestionsClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // ESC 键关闭
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, onClose]);

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

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    setSearchTags([]);
    setActiveTag(null);
    searchInputRef.current?.focus();
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
        setSelectedSuggestionIndex(-1);
        searchInputRef.current?.blur();
        break;
    }
  };

  // 处理建议点击
  const handleSuggestionClick = (chargeBaby: ChargeBaby) => {
    addSearchHistory(chargeBaby.displayName || chargeBaby.title);
    setSearchQuery(chargeBaby.displayName || chargeBaby.title);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // 直接触发产品选择
    onSelect(chargeBaby);
    onClose();
  };

  // 处理搜索标签点击
  const handleTagClick = (tag: SearchTag) => {
    const availableProducts = chargeBabies.filter(product =>
      product.model !== 'WeChat' && !excludedIds.includes(product.id)
    );

    // 使用 applyTagFilter 应用标签筛选
    const filteredBabies = applyTagFilter(availableProducts, tag);

    setFilteredProducts(filteredBabies);
    // 设置活跃标签，防止搜索过滤逻辑覆盖结果
    setActiveTag(tag);
    // 清空搜索框，避免协议名称进行二次筛选
    setSearchQuery('');
    // 添加到搜索历史
    addSearchHistory(tag.label);
    setShowSuggestions(false);
    setSearchTags([]);
  };

  // 处理输入框焦点
  const handleInputFocus = () => {
    if (searchQuery.length >= 1 && searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // 处理输入框失去焦点
  const handleInputBlur = () => {
    // 延迟隐藏建议，以便用户能够点击建议项
    setTimeout(() => {
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // 处理搜索提交
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      addSearchHistory(searchQuery.trim());
      setShowSuggestions(false);
    }
  };

  const handleSelect = (product: ChargeBaby) => {
    onSelect(product);
    onClose();
  };

  // 渲染搜索建议组件
  const renderSearchSuggestions = () => {
    const hasSuggestions = showSuggestions && searchSuggestions.length > 0;
    const hasTags = showSuggestions && searchTags.length > 0 && searchQuery.length >= 1;

    if (!hasSuggestions && !hasTags) return null;

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
                <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
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
                      <NotionImage
                        src={chargeBaby.imageUrl}
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

          {/* 搜索提示底部 */}
          <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100 flex items-center justify-between">
            <span>按 ↵ 搜索 · 按 ↑↓ 导航 · 按 ESC 关闭</span>
            {hasSuggestions && <span>{searchSuggestions.length} 个结果</span>}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  // 移动端底部弹窗
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-50 flex items-end">
        {/* 背景遮罩 */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* 底部弹窗内容 */}
        <div
          ref={modalRef}
          className="relative bg-white w-full h-[85vh] max-h-[85vh] rounded-t-3xl shadow-2xl animate-slide-up flex flex-col"
        >
          {/* 拖拽指示器 */}
          <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 pb-4 flex-shrink-0">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-gray-900">
                选择充电宝 {position > 1 && position}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-4 pb-4 flex-shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索型号、品牌..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {/* 搜索建议 */}
              {renderSearchSuggestions()}
            </div>
          </div>

          {/* 活跃标签显示 */}
          {activeTag && (
            <div className="px-4 pb-3 flex-shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-500">当前筛选:</span>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 border border-blue-200 rounded-full">
                  <div className={`w-2 h-2 rounded-full ${
                    activeTag.type === 'brand' ? 'bg-blue-500' :
                    activeTag.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-xs font-medium text-blue-700">{activeTag.label}</span>
                  <button
                    onClick={() => {
                      setActiveTag(null);
                      // 重新显示所有可用产品
                      const availableProducts = chargeBabies.filter(product =>
                        product.model !== 'WeChat' && !excludedIds.includes(product.id)
                      );
                      setFilteredProducts(availableProducts);
                    }}
                    className="ml-1 text-blue-500 hover:text-blue-700"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs text-gray-500">
                  · <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 个结果
                </span>
              </div>
            </div>
          )}

          {/* 搜索结果统计 */}
          <div className="px-4 pb-3 flex-shrink-0">
            <div className="text-sm text-gray-500">
              {searchQuery && !activeTag && (
                <>
                  找到 <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 个结果
                </>
              )}
            </div>
          </div>

          {/* 产品列表 */}
          <div className="flex-1 overflow-y-auto px-4 pb-6 min-h-0">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product, index) => (
                  <SimpleChargeBabyCard
                    key={product.id}
                    product={product}
                    onClick={() => handleSelect(product)}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
            ) : searchQuery ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <div className="text-gray-600">
                  <div className="text-lg font-medium mb-1">未找到相关结果</div>
                  <div className="text-sm">请尝试使用不同的关键词搜索</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-600">暂无可选产品</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 桌面端右侧弹窗
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* 右侧弹窗内容 */}
      <div
        ref={modalRef}
        className="relative bg-white w-full max-w-2xl h-full shadow-2xl animate-slide-in-right flex flex-col"
      >
        {/* 标题栏 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">
            选择充电宝 {position > 1 && position}
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 搜索框 */}
        <div className="p-6 pb-4 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜索型号、品牌..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* 搜索建议 */}
            {renderSearchSuggestions()}
          </div>
        </div>

        {/* 活跃标签显示 */}
        {activeTag && (
          <div className="px-6 pb-4 flex-shrink-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">当前筛选:</span>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
                <div className={`w-2.5 h-2.5 rounded-full ${
                  activeTag.type === 'brand' ? 'bg-blue-500' :
                  activeTag.type === 'protocol' ? 'bg-green-500' : 'bg-purple-500'
                }`} />
                <span className="text-sm font-medium text-blue-700">{activeTag.label}</span>
                <button
                  onClick={() => {
                    setActiveTag(null);
                    // 重新显示所有可用产品
                    const availableProducts = chargeBabies.filter(product =>
                      product.model !== 'WeChat' && !excludedIds.includes(product.id)
                    );
                    setFilteredProducts(availableProducts);
                  }}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="text-sm text-gray-500">
                · <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 个结果
              </span>
            </div>
          </div>
        )}

        {/* 搜索结果统计 */}
        <div className="px-6 pb-4 flex-shrink-0">
          <div className="text-sm text-gray-500">
            {searchQuery && !activeTag && (
              <>
                找到 <span className="font-semibold text-gray-900">{filteredProducts.length}</span> 个结果
              </>
            )}
          </div>
        </div>

        {/* 产品列表 */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {filteredProducts.map((product, index) => (
                <SimpleChargeBabyCard
                  key={product.id}
                  product={product}
                  onClick={() => handleSelect(product)}
                  searchQuery={searchQuery}
                />
              ))}
            </div>
          ) : searchQuery ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-600">
                <div className="text-lg font-medium mb-2">未找到相关结果</div>
                <div className="text-sm">请尝试使用不同的关键词搜索</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">暂无可选产品</div>
          )}
        </div>
      </div>
    </div>
  );
}