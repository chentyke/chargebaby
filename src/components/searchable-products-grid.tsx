'use client';

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { ChargeBabyCard } from '@/components/charge-baby-card';
import { SearchCompareToolbar } from '@/components/search-compare-toolbar';

interface SearchableProductsGridProps {
  chargeBabies: ChargeBaby[];
}

export function SearchableProductsGrid({ chargeBabies }: SearchableProductsGridProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) {
      return chargeBabies;
    }

    const query = searchQuery.toLowerCase().trim();
    return chargeBabies.filter((chargeBaby) => {
      const searchFields = [
        chargeBaby.title,
        chargeBaby.displayName,
        chargeBaby.model,
        chargeBaby.subtitle,
        ...(Array.isArray(chargeBaby.tags) ? chargeBaby.tags : [])
      ].filter(Boolean);

      return searchFields.some(field => 
        field?.toString().toLowerCase().includes(query)
      );
    });
  }, [chargeBabies, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="space-y-8">
      {/* 搜索对比工具栏 - 与标题融合 */}
      <SearchCompareToolbar
        onSearch={handleSearch}
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

      {/* 产品网格 */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((chargeBaby, index) => (
            <ChargeBabyCard
              key={chargeBaby.id}
              chargeBaby={chargeBaby}
              index={index}
            />
          ))}
        </div>
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