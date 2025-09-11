'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, X, ChevronDown, ArrowUpDown } from 'lucide-react';
import { ChargeBaby, FilterOptions, PRODUCT_FEATURES, SORT_OPTIONS, SortOption } from '@/types/chargebaby';

interface FilterComponentProps {
  chargeBabies: ChargeBaby[];
  onFilterChange: (filteredBabies: ChargeBaby[], sortBy: SortOption) => void;
  isMobile?: boolean;
  className?: string;
}

export function FilterComponent({ chargeBabies, onFilterChange, isMobile = false, className = '' }: FilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    capacityRange: { min: 0, max: 100000 },
    powerRange: { min: 0, max: 1000 },
    brands: [],
    features: [],
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  // 获取所有可用的品牌
  const availableBrands = Array.from(new Set(
    (chargeBabies || [])
      .filter(baby => baby.brand)
      .map(baby => baby.brand)
      .filter(Boolean)
  )).sort();

  // 获取容量和功率的范围
  const capacityData = (chargeBabies || []).filter(b => b.detailData?.capacityLevel).map(b => b.detailData!.capacityLevel);
  const capacityRange = {
    min: capacityData.length > 0 ? Math.min(...capacityData) : 0,
    max: capacityData.length > 0 ? Math.max(...capacityData) : 100000
  };

  const powerData = (chargeBabies || []).map(b => {
    const maxOutput = b.detailData?.maxOutputPower || 0;
    const maxSelfCharging = b.detailData?.maxSelfChargingPower || 0;
    return Math.max(maxOutput, maxSelfCharging);
  }).filter(p => p > 0);
  
  const powerRange = {
    min: 0,
    max: powerData.length > 0 ? Math.max(...powerData) : 1000
  };

  // 应用筛选
  useEffect(() => {
    if (!chargeBabies || chargeBabies.length === 0) {
      onFilterChange([], filters.sortBy);
      return;
    }

    let filtered = chargeBabies;

    // 容量筛选
    if (filters.capacityRange.min > capacityRange.min || filters.capacityRange.max < capacityRange.max) {
      filtered = filtered.filter(baby => {
        const capacity = baby.detailData?.capacityLevel || 0;
        return capacity >= filters.capacityRange.min && capacity <= filters.capacityRange.max;
      });
    }

    // 功率筛选
    if (filters.powerRange.min > powerRange.min || filters.powerRange.max < powerRange.max) {
      filtered = filtered.filter(baby => {
        const maxOutput = baby.detailData?.maxOutputPower || 0;
        const maxSelfCharging = baby.detailData?.maxSelfChargingPower || 0;
        const maxPower = Math.max(maxOutput, maxSelfCharging);
        return maxPower >= filters.powerRange.min && maxPower <= filters.powerRange.max;
      });
    }

    // 品牌筛选
    if (filters.brands.length > 0) {
      filtered = filtered.filter(baby => 
        baby.brand && filters.brands.includes(baby.brand)
      );
    }

    // 产品特性筛选（这里需要根据实际数据库字段调整）
    if (filters.features.length > 0) {
      filtered = filtered.filter(baby => {
        // 这里需要根据您数据库中的实际字段来实现
        // 暂时使用标签进行筛选
        return filters.features.some(feature => 
          baby.tags?.some(tag => tag.includes(feature))
        );
      });
    }

    // 应用排序
    filtered = [...filtered].sort((a, b) => {
      let valueA: any;
      let valueB: any;

      switch (filters.sortBy) {
        case 'updatedAt':
          valueA = new Date(a.updatedAt).getTime();
          valueB = new Date(b.updatedAt).getTime();
          break;
        case 'capacity':
          valueA = a.detailData?.capacityLevel || 0;
          valueB = b.detailData?.capacityLevel || 0;
          break;
        case 'power':
          valueA = Math.max(a.detailData?.maxOutputPower || 0, a.detailData?.maxSelfChargingPower || 0);
          valueB = Math.max(b.detailData?.maxOutputPower || 0, b.detailData?.maxSelfChargingPower || 0);
          break;
        case 'overallRating':
          valueA = a.overallRating || 0;
          valueB = b.overallRating || 0;
          break;
        case 'performanceRating':
          valueA = a.performanceRating || 0;
          valueB = b.performanceRating || 0;
          break;
        case 'experienceRating':
          valueA = a.experienceRating || 0;
          valueB = b.experienceRating || 0;
          break;
        case 'alphabetical':
          valueA = a.model.toLowerCase();
          valueB = b.model.toLowerCase();
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      } else {
        return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
      }
    });

    onFilterChange(filtered, filters.sortBy);
  }, [filters, chargeBabies, onFilterChange, capacityRange.min, capacityRange.max, powerRange.min, powerRange.max]);

  const resetFilters = useCallback(() => {
    setFilters({
      capacityRange: { min: capacityRange.min, max: capacityRange.max },
      powerRange: { min: powerRange.min, max: powerRange.max },
      brands: [],
      features: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  }, [capacityRange.min, capacityRange.max, powerRange.min, powerRange.max]);

  const hasActiveFilters = 
    filters.capacityRange.min > capacityRange.min ||
    filters.capacityRange.max < capacityRange.max ||
    filters.powerRange.min > powerRange.min ||
    filters.powerRange.max < powerRange.max ||
    filters.brands.length > 0 ||
    filters.features.length > 0 ||
    filters.sortBy !== 'updatedAt' ||
    filters.sortOrder !== 'desc';

  return (
    <div className={`relative ${className}`}>
      {/* 筛选按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center ${isMobile ? 'justify-center w-12 h-12' : 'gap-2 h-12 px-4'} bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 transition-all duration-300 group ${
          hasActiveFilters 
            ? 'text-green-600 hover:text-green-700 hover:bg-green-50/30' 
            : 'text-gray-600 hover:text-gray-700 hover:bg-gray-50/30'
        }`}
      >
        <Filter className="w-5 h-5" />
        {!isMobile && (
          <>
            <span className="text-sm font-medium whitespace-nowrap">筛选</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
        {hasActiveFilters && (
          <div className={`w-2 h-2 bg-green-500 rounded-full ${isMobile ? 'absolute top-2 right-2' : ''}`}></div>
        )}
      </button>

      {/* 筛选面板 */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className={`${
            isMobile 
              ? 'fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl shadow-black/20' 
              : 'absolute top-full right-0 mt-2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl border border-white/40 shadow-2xl shadow-black/10'
          } z-50 ${isMobile ? 'animate-slide-up' : 'animate-scale-in'}`}>
            {/* 移动端拖拽指示器 */}
            {isMobile && (
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>
            )}
            
            <div className={`${isMobile ? 'px-4 pb-6 space-y-5 max-h-[80vh] overflow-y-auto' : 'p-6 space-y-6'}`}>
              {/* 标题和重置按钮 */}
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold text-gray-900 ${isMobile ? 'text-base' : 'text-lg'}`}>筛选条件</h3>
                <div className="flex items-center gap-3">
                  {hasActiveFilters && (
                    <button
                      onClick={resetFilters}
                      className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      重置
                    </button>
                  )}
                  {isMobile && (
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 排序选项 - 移到最上方 */}
              <div>
                <label className={`block font-medium text-gray-700 mb-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>排序方式</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-2">排序字段</label>
                    <select
                      value={filters.sortBy}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        sortBy: e.target.value as SortOption
                      }))}
                      className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        isMobile ? 'py-3' : 'py-2'
                      }`}
                    >
                      {SORT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-gray-500">排序方向</label>
                    <button
                      onClick={() => setFilters(prev => ({
                        ...prev,
                        sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                      }))}
                      className={`flex items-center gap-2 px-3 border border-gray-200 rounded-lg text-sm transition-colors hover:bg-gray-50 ${
                        isMobile ? 'py-3' : 'py-2'
                      }`}
                    >
                      <ArrowUpDown className="w-4 h-4" />
                      <span>{filters.sortOrder === 'asc' ? '升序' : '降序'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 容量筛选 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    容量 (mAh)
                  </label>
                  <div className="text-xs text-gray-500">
                    {filters.capacityRange.min.toLocaleString()} - {filters.capacityRange.max.toLocaleString()} mAh
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">最小值</label>
                      <input
                        type="number"
                        placeholder="最小值"
                        value={filters.capacityRange.min || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          capacityRange: { ...prev.capacityRange, min: Number(e.target.value) || 0 }
                        }))}
                        className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isMobile ? 'py-3' : 'py-2'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">最大值</label>
                      <input
                        type="number"
                        placeholder="最大值"
                        value={filters.capacityRange.max || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          capacityRange: { ...prev.capacityRange, max: Number(e.target.value) || 100000 }
                        }))}
                        className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isMobile ? 'py-3' : 'py-2'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 充电功率筛选 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    充电功率 (W)
                  </label>
                  <div className="text-xs text-gray-500">
                    {filters.powerRange.min} - {filters.powerRange.max} W
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">最小值</label>
                      <input
                        type="number"
                        placeholder="最小值"
                        value={filters.powerRange.min || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          powerRange: { ...prev.powerRange, min: Number(e.target.value) || 0 }
                        }))}
                        className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isMobile ? 'py-3' : 'py-2'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">最大值</label>
                      <input
                        type="number"
                        placeholder="最大值"
                        value={filters.powerRange.max || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          powerRange: { ...prev.powerRange, max: Number(e.target.value) || 1000 }
                        }))}
                        className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isMobile ? 'py-3' : 'py-2'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 品牌筛选 */}
              <div>
                <label className={`block font-medium text-gray-700 mb-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>品牌</label>
                <div className={`space-y-2 overflow-y-auto border border-gray-100 rounded-lg p-3 ${
                  isMobile ? 'max-h-40' : 'max-h-36'
                }`}>
                  {availableBrands.length > 0 ? availableBrands.map(brand => (
                    <label key={brand} className={`flex items-center hover:bg-gray-50 -mx-1 px-1 rounded cursor-pointer ${
                      isMobile ? 'py-2' : 'py-1'
                    }`}>
                      <input
                        type="checkbox"
                        checked={filters.brands.includes(brand)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              brands: [...prev.brands, brand]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              brands: prev.brands.filter(b => b !== brand)
                            }));
                          }
                        }}
                        className={`rounded text-blue-600 focus:ring-blue-500 ${
                          isMobile ? 'mr-3 w-4 h-4' : 'mr-3'
                        }`}
                      />
                      <span className="text-sm text-gray-700 flex-1">{brand}</span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-400 text-center py-2">暂无品牌数据</div>
                  )}
                </div>
              </div>

              {/* 产品特性筛选 */}
              <div>
                <label className={`block font-medium text-gray-700 mb-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>产品特性</label>
                <div className={`grid gap-2 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                  {PRODUCT_FEATURES.map(feature => (
                    <label key={feature} className={`flex items-center hover:bg-gray-50 rounded-lg cursor-pointer ${
                      isMobile ? 'p-3 border border-gray-100' : 'p-2'
                    }`}>
                      <input
                        type="checkbox"
                        checked={filters.features.includes(feature)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              features: [...prev.features, feature]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              features: prev.features.filter(f => f !== feature)
                            }));
                          }
                        }}
                        className={`rounded text-blue-600 focus:ring-blue-500 ${
                          isMobile ? 'mr-3 w-4 h-4' : 'mr-2'
                        }`}
                      />
                      <span className="text-sm text-gray-700 flex-1">{feature}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}