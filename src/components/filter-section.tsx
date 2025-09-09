'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FilterOptions {
  brands: string[];
  capacityRanges: { label: string; min: number; max: number }[];
  powerRanges: { label: string; min: number; max: number }[];
  priceRanges: { label: string; min: number; max: number }[];
}

interface ActiveFilters {
  search: string;
  brands: string[];
  capacityRange: { min: number; max: number } | null;
  powerRange: { min: number; max: number } | null;
  priceRange: { min: number; max: number } | null;
  sortBy: 'name' | 'price' | 'rating' | 'capacity';
  sortOrder: 'asc' | 'desc';
}

interface FilterSectionProps {
  filterOptions: FilterOptions;
  onFiltersChange: (filters: ActiveFilters) => void;
  className?: string;
}

const defaultFilters: ActiveFilters = {
  search: '',
  brands: [],
  capacityRange: null,
  powerRange: null,
  priceRange: null,
  sortBy: 'rating',
  sortOrder: 'desc',
};

export function FilterSection({ filterOptions, onFiltersChange, className }: FilterSectionProps) {
  const [filters, setFilters] = useState<ActiveFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const updateFilters = (updates: Partial<ActiveFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  const clearFilters = () => {
    setFilters(defaultFilters);
  };

  const toggleBrand = (brand: string) => {
    const newBrands = filters.brands.includes(brand)
      ? filters.brands.filter(b => b !== brand)
      : [...filters.brands, brand];
    updateFilters({ brands: newBrands });
  };

  const hasActiveFilters = 
    filters.search ||
    filters.brands.length > 0 ||
    filters.capacityRange ||
    filters.powerRange ||
    filters.priceRange;

  return (
    <div className={cn('bg-white border-b border-gray-200', className)}>
      <div className="container py-4">
        {/* 搜索栏和筛选按钮 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="搜索充电宝型号、品牌..."
              className="input pl-10 w-full"
              value={filters.search}
              onChange={(e) => updateFilters({ search: e.target.value })}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'btn btn-outline flex items-center gap-2',
                showFilters && 'bg-primary text-primary-foreground'
              )}
            >
              <Filter className="w-4 h-4" />
              筛选
              {hasActiveFilters && (
                <span className="bg-red-500 text-white text-xs rounded-full w-2 h-2"></span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="btn btn-outline text-red-600 hover:bg-red-50"
              >
                <X className="w-4 h-4" />
                清除
              </button>
            )}
          </div>
        </div>

        {/* 排序选项 */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">排序：</span>
          <select
            className="input py-1 px-2 text-sm"
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [typeof filters.sortBy, typeof filters.sortOrder];
              updateFilters({ sortBy, sortOrder });
            }}
          >
            <option value="rating-desc">评分由高到低</option>
            <option value="rating-asc">评分由低到高</option>
            <option value="price-asc">价格由低到高</option>
            <option value="price-desc">价格由高到低</option>
            <option value="capacity-desc">容量由大到小</option>
            <option value="capacity-asc">容量由小到大</option>
            <option value="name-asc">名称A-Z</option>
            <option value="name-desc">名称Z-A</option>
          </select>
        </div>

        {/* 详细筛选面板 */}
        {showFilters && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg space-y-6">
            {/* 标签筛选 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">产品标签</h3>
              <div className="flex flex-wrap gap-2">
                {filterOptions.brands.map(brand => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm border transition-colors',
                      filters.brands.includes(brand)
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* 综合评分筛选 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">综合评分</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {filterOptions.capacityRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => updateFilters({ 
                      capacityRange: filters.capacityRange?.min === range.min ? null : range 
                    })}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm border transition-colors',
                      filters.capacityRange?.min === range.min
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 性能评分筛选 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">性能评分</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {filterOptions.powerRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => updateFilters({ 
                      powerRange: filters.powerRange?.min === range.min ? null : range 
                    })}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm border transition-colors',
                      filters.powerRange?.min === range.min
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 价格筛选 */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">价格区间</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {filterOptions.priceRanges.map(range => (
                  <button
                    key={range.label}
                    onClick={() => updateFilters({ 
                      priceRange: filters.priceRange?.min === range.min ? null : range 
                    })}
                    className={cn(
                      'px-3 py-2 rounded-md text-sm border transition-colors',
                      filters.priceRange?.min === range.min
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-600'
                    )}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
