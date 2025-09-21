'use client';

import { useState, useEffect, useCallback } from 'react';
import { Filter, X, ChevronDown, ArrowUpDown, Settings, Zap, Battery, Smartphone } from 'lucide-react';
import { ChargeBaby, FilterOptions, PRODUCT_FEATURES, SORT_OPTIONS, SortOption } from '@/types/chargebaby';

interface FilterComponentProps {
  chargeBabies: ChargeBaby[];
  onFilterChange: (filteredBabies: ChargeBaby[], sortBy: SortOption, hasFilters: boolean) => void;
  isMobile?: boolean;
  isInline?: boolean;
  className?: string;
}

export function FilterComponent({ chargeBabies, onFilterChange, isMobile = false, isInline = false, className = '' }: FilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    capacityRange: { min: 0, max: 100000 },
    powerRange: { min: 0, max: 1000 },
    priceRange: { min: 0, max: 1000 },
    brands: [],
    features: [],
    protocols: [],
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

  // 动态获取所有可用的协议
  const availableProtocols = Array.from(new Set(
    (chargeBabies || [])
      .filter(baby => baby.protocols && baby.protocols.length > 0)
      .flatMap(baby => baby.protocols)
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

  // 获取价格范围
  const priceData = (chargeBabies || []).filter(b => b.price && b.price > 0).map(b => b.price);
  const priceRange = {
    min: priceData.length > 0 ? Math.min(...priceData) : 0,
    max: priceData.length > 0 ? Math.max(...priceData) : 1000
  };

  // 检查是否有激活的筛选条件
  const hasActiveFilters = 
    filters.capacityRange.min > capacityRange.min ||
    filters.capacityRange.max < capacityRange.max ||
    filters.powerRange.min > powerRange.min ||
    filters.powerRange.max < powerRange.max ||
    filters.priceRange.min > priceRange.min ||
    filters.priceRange.max < priceRange.max ||
    filters.brands.length > 0 ||
    filters.features.length > 0 ||
    filters.protocols.length > 0 ||
    filters.sortBy !== 'updatedAt' ||
    filters.sortOrder !== 'desc';

  // 初始化筛选条件为实际数据范围
  useEffect(() => {
    if (chargeBabies && chargeBabies.length > 0) {
      setFilters(prev => ({
        ...prev,
        capacityRange: { min: capacityRange.min, max: capacityRange.max },
        powerRange: { min: powerRange.min, max: powerRange.max },
        priceRange: { min: priceRange.min, max: priceRange.max }
      }));
    }
  }, [chargeBabies.length, capacityRange.min, capacityRange.max, powerRange.min, powerRange.max, priceRange.min, priceRange.max]);

  // 应用筛选
  useEffect(() => {
    if (!chargeBabies || chargeBabies.length === 0) {
      onFilterChange([], filters.sortBy, false);
      return;
    }

    let filtered = [...chargeBabies];

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

    // 价格筛选
    if (filters.priceRange.min > priceRange.min || filters.priceRange.max < priceRange.max) {
      filtered = filtered.filter(baby => {
        const price = baby.price || 0;
        return price >= filters.priceRange.min && price <= filters.priceRange.max;
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

    // 协议筛选 - 基于真实数据库的协议字段
    if (filters.protocols.length > 0) {
      filtered = filtered.filter(baby => {
        if (!baby.protocols || baby.protocols.length === 0) return false;
        
        // 检查产品的协议列表是否包含用户选择的任一协议
        return filters.protocols.some(selectedProtocol => 
          baby.protocols.includes(selectedProtocol)
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
        case 'price':
          valueA = a.price || 0;
          valueB = b.price || 0;
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

    onFilterChange(filtered, filters.sortBy, hasActiveFilters);
  }, [filters, chargeBabies, onFilterChange, capacityRange.min, capacityRange.max, powerRange.min, powerRange.max, priceRange.min, priceRange.max, hasActiveFilters]);

  const resetFilters = useCallback(() => {
    setFilters({
      capacityRange: { min: capacityRange.min, max: capacityRange.max },
      powerRange: { min: powerRange.min, max: powerRange.max },
      priceRange: { min: priceRange.min, max: priceRange.max },
      brands: [],
      features: [],
      protocols: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  }, [capacityRange.min, capacityRange.max, powerRange.min, powerRange.max, priceRange.min, priceRange.max]);

  // 内联模式直接显示筛选内容
  if (isInline) {
    return (
      <>
        <div className={`${className} overflow-hidden`}>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-3 px-4 min-w-max">
              {/* 排序字段块 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-indigo-50/80 via-indigo-50/60 to-indigo-50/40 backdrop-blur-2xl rounded-xl border border-indigo-200/50 flex-shrink-0 min-h-[36px]">
                <ArrowUpDown className="w-4 h-4 text-indigo-600" />
                <span className="text-sm text-indigo-700 whitespace-nowrap">排序</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as SortOption
                  }))}
                  className="text-sm bg-transparent border-none focus:outline-none text-indigo-700 min-w-0 py-1"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序方向切换块 */}
              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                }))}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-purple-50/80 via-purple-50/60 to-purple-50/40 backdrop-blur-2xl rounded-xl border border-purple-200/50 flex-shrink-0 hover:bg-gradient-to-br hover:from-purple-100/80 hover:via-purple-100/60 hover:to-purple-100/40 transition-all duration-300 min-h-[36px]"
              >
                <span className="text-sm text-purple-700 whitespace-nowrap">
                  {filters.sortOrder === 'asc' ? '升序' : '降序'}
                </span>
                <span className="text-purple-600">{filters.sortOrder === 'asc' ? '↑' : '↓'}</span>
              </button>

              {/* 容量块 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-green-50/80 via-green-50/60 to-green-50/40 backdrop-blur-2xl rounded-xl border border-green-200/50 flex-shrink-0">
                <Battery className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-700 whitespace-nowrap">容量</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="最小"
                    value={filters.capacityRange.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      capacityRange: { ...prev.capacityRange, min: e.target.value === '' ? capacityRange.min : Number(e.target.value) }
                    }))}
                    className="w-14 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={filters.capacityRange.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      capacityRange: { ...prev.capacityRange, max: e.target.value === '' ? capacityRange.max : Number(e.target.value) }
                    }))}
                    className="w-14 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 功率块 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-yellow-50/80 via-yellow-50/60 to-yellow-50/40 backdrop-blur-2xl rounded-xl border border-yellow-200/50 flex-shrink-0">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-yellow-700 whitespace-nowrap">功率</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="最小"
                    value={filters.powerRange.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      powerRange: { ...prev.powerRange, min: e.target.value === '' ? powerRange.min : Number(e.target.value) }
                    }))}
                    className="w-12 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={filters.powerRange.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      powerRange: { ...prev.powerRange, max: e.target.value === '' ? powerRange.max : Number(e.target.value) }
                    }))}
                    className="w-12 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 价格块 */}
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-red-50/80 via-red-50/60 to-red-50/40 backdrop-blur-2xl rounded-xl border border-red-200/50 flex-shrink-0">
                <span className="text-sm text-red-700 whitespace-nowrap">¥</span>
                <span className="text-sm text-red-700 whitespace-nowrap">价格</span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    placeholder="最小"
                    value={filters.priceRange.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: e.target.value === '' ? priceRange.min : Number(e.target.value) }
                    }))}
                    className="w-14 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={filters.priceRange.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: e.target.value === '' ? priceRange.max : Number(e.target.value) }
                    }))}
                    className="w-12 px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* 品牌块 */}
              {availableBrands.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-cyan-50/80 via-cyan-50/60 to-cyan-50/40 backdrop-blur-2xl rounded-xl border border-cyan-200/50 flex-shrink-0">
                  <Smartphone className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm text-cyan-700 whitespace-nowrap">品牌</span>
                  <div className="flex gap-1">
                    {availableBrands.slice(0, 3).map(brand => (
                      <label key={brand} className="cursor-pointer">
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
                          className="sr-only"
                        />
                        <span className={`px-2 py-1 text-xs rounded-md border transition-all duration-200 whitespace-nowrap ${
                          filters.brands.includes(brand)
                            ? 'bg-blue-100 text-blue-700 border-blue-300'
                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                        }`}>
                          {brand}
                        </span>
                      </label>
                    ))}
                    {availableBrands.length > 3 && (
                      <button
                        onClick={() => setShowAdvancedModal(true)}
                        className="px-2 py-1 text-xs text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors whitespace-nowrap"
                      >
                        +{availableBrands.length - 3}个
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 更多配置块 */}
              <button
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-br from-slate-50/80 via-slate-50/60 to-slate-50/40 backdrop-blur-2xl rounded-xl border border-slate-200/50 hover:bg-gradient-to-br hover:from-slate-100/80 hover:via-slate-100/60 hover:to-slate-100/40 transition-all duration-300 flex-shrink-0"
              >
                <Settings className="w-4 h-4 text-slate-600" />
                <span className="text-sm text-slate-700 whitespace-nowrap">更多</span>
                {(filters.features.length > 0 || filters.protocols.length > 0) && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>

              {/* 重置按钮 */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 py-2 bg-gradient-to-br from-red-50/95 via-red-50/90 to-red-50/80 backdrop-blur-2xl rounded-xl border border-red-200/50 text-red-600 hover:text-red-700 hover:bg-gradient-to-br hover:from-red-100/80 hover:via-red-100/60 hover:to-red-100/40 transition-all duration-300 flex-shrink-0"
                >
                  <X className="w-3 h-3" />
                  <span className="text-sm whitespace-nowrap">重置</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 高级配置弹窗 */}
        {showAdvancedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowAdvancedModal(false)} />
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl shadow-black/10 max-h-[80vh] overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">高级筛选</h3>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
                {/* 所有品牌 */}
                {availableBrands.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">品牌选择</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableBrands.map(brand => (
                        <label key={brand} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                            className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 充电协议 */}
                {availableProtocols.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">充电协议</label>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {availableProtocols.map(protocol => (
                        <label key={protocol} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                          <input
                            type="checkbox"
                            checked={filters.protocols.includes(protocol)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFilters(prev => ({
                                  ...prev,
                                  protocols: [...prev.protocols, protocol]
                                }));
                              } else {
                                setFilters(prev => ({
                                  ...prev,
                                  protocols: prev.protocols.filter(p => p !== protocol)
                                }));
                              }
                            }}
                            className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">{protocol}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* 产品特性 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">产品特性</label>
                  <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                    {PRODUCT_FEATURES.map(feature => (
                      <label key={feature} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
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
                          className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-4 border-t border-gray-100">
                <button
                  onClick={resetFilters}
                  className="flex-1 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  重置所有
                </button>
                <button
                  onClick={() => setShowAdvancedModal(false)}
                  className="flex-1 px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  完成
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 筛选按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center ${isMobile ? 'justify-center w-12 h-12' : 'gap-2 h-12 px-4'} bg-gradient-to-br from-violet-50/80 via-violet-50/60 to-violet-50/40 backdrop-blur-2xl rounded-2xl border border-violet-200/50 transition-all duration-300 group ${
          hasActiveFilters 
            ? 'text-green-600 hover:text-green-700 hover:bg-gradient-to-br hover:from-green-100/80 hover:via-green-100/60 hover:to-green-100/40' 
            : 'text-violet-600 hover:text-violet-700 hover:bg-gradient-to-br hover:from-violet-100/80 hover:via-violet-100/60 hover:to-violet-100/40'
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
                          capacityRange: { ...prev.capacityRange, min: e.target.value === '' ? capacityRange.min : Number(e.target.value) }
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
                          capacityRange: { ...prev.capacityRange, max: e.target.value === '' ? capacityRange.max : Number(e.target.value) }
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
                          powerRange: { ...prev.powerRange, min: e.target.value === '' ? powerRange.min : Number(e.target.value) }
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
                          powerRange: { ...prev.powerRange, max: e.target.value === '' ? powerRange.max : Number(e.target.value) }
                        }))}
                        className={`w-full px-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          isMobile ? 'py-3' : 'py-2'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 价格筛选 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    价格 (¥)
                  </label>
                  <div className="text-xs text-gray-500">
                    ¥{filters.priceRange.min} - ¥{filters.priceRange.max}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">最小值</label>
                      <input
                        type="number"
                        placeholder="最小值"
                        value={filters.priceRange.min || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, min: e.target.value === '' ? priceRange.min : Number(e.target.value) }
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
                        value={filters.priceRange.max || ''}
                        onChange={(e) => setFilters(prev => ({
                          ...prev,
                          priceRange: { ...prev.priceRange, max: e.target.value === '' ? priceRange.max : Number(e.target.value) }
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

              {/* 充电协议筛选 */}
              <div>
                <label className={`block font-medium text-gray-700 mb-3 ${isMobile ? 'text-sm' : 'text-sm'}`}>充电协议</label>
                <div className={`space-y-2 overflow-y-auto border border-gray-100 rounded-lg p-3 ${
                  isMobile ? 'max-h-40' : 'max-h-36'
                }`}>
                  {availableProtocols.length > 0 ? availableProtocols.map(protocol => (
                    <label key={protocol} className={`flex items-center hover:bg-gray-50 -mx-1 px-1 rounded cursor-pointer ${
                      isMobile ? 'py-2' : 'py-1'
                    }`}>
                      <input
                        type="checkbox"
                        checked={filters.protocols.includes(protocol)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              protocols: [...prev.protocols, protocol]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              protocols: prev.protocols.filter(p => p !== protocol)
                            }));
                          }
                        }}
                        className={`rounded text-blue-600 focus:ring-blue-500 ${
                          isMobile ? 'mr-3 w-4 h-4' : 'mr-3'
                        }`}
                      />
                      <span className="text-sm text-gray-700 flex-1">{protocol}</span>
                    </label>
                  )) : (
                    <div className="text-sm text-gray-400 text-center py-2">暂无协议数据</div>
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