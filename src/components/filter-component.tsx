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

// 定义容量档位 - 移到组件外部
const CAPACITY_PRESETS = [
  { label: '不限', value: 0 },
  { label: '5K', value: 5000 },
  { label: '10K', value: 10000 },
  { label: '15K', value: 15000 },
  { label: '20K', value: 20000 },
  { label: '25K', value: 25000 },
  { label: '30K+', value: 30000 },
];

// 定义功率档位
const POWER_PRESETS = [
  { label: '不限', value: 0 },
  { label: '20W', value: 20 },
  { label: '30W', value: 30 },
  { label: '45W', value: 45 },
  { label: '65W', value: 65 },
  { label: '100W', value: 100 },
  { label: '100W+', value: 200 },
];

export function FilterComponent({ chargeBabies, onFilterChange, isMobile = false, isInline = false, className = '' }: FilterComponentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showAdvancedModal, setShowAdvancedModal] = useState(false);
  const [scrollToSection, setScrollToSection] = useState<string | null>(null);
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

  // 容量滑块状态
  const [capacitySlider, setCapacitySlider] = useState([0, CAPACITY_PRESETS.length - 1]);
  // 功率滑块状态
  const [powerSlider, setPowerSlider] = useState([0, POWER_PRESETS.length - 1]);

  // 处理容量滑块变化
  const handleCapacitySliderChange = useCallback((values: number[]) => {
    setCapacitySlider(values);
    const minCapacity = CAPACITY_PRESETS[values[0]].value;
    const maxCapacity = values[1] === CAPACITY_PRESETS.length - 1 ? 999999 : CAPACITY_PRESETS[values[1]].value;
    
    setFilters(prev => ({
      ...prev,
      capacityRange: { min: minCapacity, max: maxCapacity }
    }));
  }, []);

  // 处理功率滑块变化
  const handlePowerSliderChange = useCallback((values: number[]) => {
    setPowerSlider(values);
    const minPower = POWER_PRESETS[values[0]].value;
    const maxPower = values[1] === POWER_PRESETS.length - 1 ? 999999 : POWER_PRESETS[values[1]].value;
    
    setFilters(prev => ({
      ...prev,
      powerRange: { min: minPower, max: maxPower }
    }));
  }, []);

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
    capacitySlider[0] > 0 ||
    capacitySlider[1] < CAPACITY_PRESETS.length - 1 ||
    powerSlider[0] > 0 ||
    powerSlider[1] < POWER_PRESETS.length - 1 ||
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
        powerRange: { min: powerRange.min, max: powerRange.max },
        priceRange: { min: priceRange.min, max: priceRange.max }
      }));
    }
  }, [chargeBabies, powerRange.min, powerRange.max, priceRange.min, priceRange.max]);

  // 处理高级弹窗滚动到指定区域
  useEffect(() => {
    if (showAdvancedModal && scrollToSection) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`${scrollToSection}-section`);
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest' 
          });
        }
        setScrollToSection(null);
      }, 300); // 等待弹窗动画完成

      return () => clearTimeout(timer);
    }
  }, [showAdvancedModal, scrollToSection]);

  // 应用筛选
  useEffect(() => {
    if (!chargeBabies || chargeBabies.length === 0) {
      onFilterChange([], filters.sortBy, false);
      return;
    }

    let filtered = [...chargeBabies];

    // 容量筛选
    if (capacitySlider[0] > 0 || capacitySlider[1] < CAPACITY_PRESETS.length - 1) {
      filtered = filtered.filter(baby => {
        const capacity = baby.detailData?.capacityLevel || 0;
        const minCapacity = CAPACITY_PRESETS[capacitySlider[0]].value;
        const maxCapacity = capacitySlider[1] === CAPACITY_PRESETS.length - 1 ? 999999 : CAPACITY_PRESETS[capacitySlider[1]].value;
        return capacity >= minCapacity && capacity <= maxCapacity;
      });
    }

    // 功率筛选
    if (powerSlider[0] > 0 || powerSlider[1] < POWER_PRESETS.length - 1) {
      filtered = filtered.filter(baby => {
        const maxOutput = baby.detailData?.maxOutputPower || 0;
        const maxSelfCharging = baby.detailData?.maxSelfChargingPower || 0;
        const maxPower = Math.max(maxOutput, maxSelfCharging);
        const minPower = POWER_PRESETS[powerSlider[0]].value;
        const maxPowerLimit = powerSlider[1] === POWER_PRESETS.length - 1 ? 999999 : POWER_PRESETS[powerSlider[1]].value;
        return maxPower >= minPower && maxPower <= maxPowerLimit;
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
        case 'weight':
          valueA = a.detailData?.weight || 0;
          valueB = b.detailData?.weight || 0;
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
  }, [filters, chargeBabies, onFilterChange, capacitySlider, powerSlider, priceRange.min, priceRange.max, hasActiveFilters]);

  const resetFilters = useCallback(() => {
    setCapacitySlider([0, CAPACITY_PRESETS.length - 1]);
    setPowerSlider([0, POWER_PRESETS.length - 1]);
    setFilters({
      capacityRange: { min: 0, max: 999999 },
      powerRange: { min: 0, max: 999999 },
      priceRange: { min: priceRange.min, max: priceRange.max },
      brands: [],
      features: [],
      protocols: [],
      sortBy: 'updatedAt',
      sortOrder: 'desc'
    });
  }, [priceRange.min, priceRange.max]);

  // 内联模式直接显示筛选内容
  if (isInline) {
    return (
      <>
        <div className={`${className} overflow-hidden`}>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex items-stretch gap-2 px-4 min-w-max h-12">
              {/* 排序字段块 - 增强交互 */}
              <div className="flex items-center gap-2 px-3 bg-gradient-to-br from-indigo-50/90 via-indigo-50/70 to-indigo-50/50 backdrop-blur-2xl rounded-xl border border-indigo-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-indigo-300/60 transition-all duration-300 group">
                <ArrowUpDown className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm text-indigo-700 whitespace-nowrap font-medium">排序</span>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    sortBy: e.target.value as SortOption
                  }))}
                  className="text-sm bg-transparent border-none focus:outline-none text-indigo-700 min-w-0 py-1 cursor-pointer"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 排序方向切换块 - 增强动画 */}
              <button
                onClick={() => setFilters(prev => ({
                  ...prev,
                  sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc'
                }))}
                className="flex items-center gap-2 px-3 bg-gradient-to-br from-purple-50/90 via-purple-50/70 to-purple-50/50 backdrop-blur-2xl rounded-xl border border-purple-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-purple-300/60 transition-all duration-300 group"
              >
                <span className="text-sm text-purple-700 whitespace-nowrap font-medium">
                  {filters.sortOrder === 'asc' ? '升序' : '降序'}
                </span>
                <span className="text-purple-600 group-hover:scale-125 transition-transform duration-300">
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </span>
              </button>

              {/* 容量块 - 增强视觉反馈 */}
              <button
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center gap-2 px-3 bg-gradient-to-br from-green-50/90 via-green-50/70 to-green-50/50 backdrop-blur-2xl rounded-xl border border-green-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-green-300/60 transition-all duration-300 group"
              >
                <Battery className="w-4 h-4 text-green-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm text-green-700 whitespace-nowrap font-medium">容量</span>
                <div className="flex items-center gap-1 bg-white/60 rounded-md px-2 py-0.5 border border-green-200/40">
                  <span className="text-xs text-gray-700 whitespace-nowrap font-semibold">
                    {CAPACITY_PRESETS[capacitySlider[0]].label}
                  </span>
                  <span className="text-gray-400 text-xs">-</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap font-semibold">
                    {CAPACITY_PRESETS[capacitySlider[1]].label}
                  </span>
                </div>
              </button>

              {/* 最大功率块 - 增强视觉反馈 */}
              <button
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center gap-2 px-3 bg-gradient-to-br from-yellow-50/90 via-yellow-50/70 to-yellow-50/50 backdrop-blur-2xl rounded-xl border border-yellow-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-yellow-300/60 transition-all duration-300 group"
              >
                <Zap className="w-4 h-4 text-yellow-600 group-hover:scale-110 transition-transform duration-200" />
                <span className="text-sm text-yellow-700 whitespace-nowrap font-medium">功率</span>
                <div className="flex items-center gap-1 bg-white/60 rounded-md px-2 py-0.5 border border-yellow-200/40">
                  <span className="text-xs text-gray-700 whitespace-nowrap font-semibold">
                    {POWER_PRESETS[powerSlider[0]].label}
                  </span>
                  <span className="text-gray-400 text-xs">-</span>
                  <span className="text-xs text-gray-700 whitespace-nowrap font-semibold">
                    {POWER_PRESETS[powerSlider[1]].label}
                  </span>
                </div>
              </button>

              {/* 价格块 - 改进输入框样式 */}
              <div className="flex items-center gap-2 px-3 bg-gradient-to-br from-red-50/90 via-red-50/70 to-red-50/50 backdrop-blur-2xl rounded-xl border border-red-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-red-300/60 transition-all duration-300 group">
                <span className="text-sm text-red-700 whitespace-nowrap font-medium">¥价格</span>
                <div className="flex items-center gap-1 bg-white/70 rounded-md px-2 py-1 border border-red-200/40">
                  <input
                    type="number"
                    placeholder="最小"
                    value={filters.priceRange.min === priceRange.min ? '' : (filters.priceRange.min || '')}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: e.target.value === '' ? priceRange.min : Number(e.target.value) }
                    }))}
                    className="w-12 text-xs border-none bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                  />
                  <span className="text-gray-400 text-xs">-</span>
                  <input
                    type="number"
                    placeholder="最大"
                    value={filters.priceRange.max === priceRange.max ? '' : (filters.priceRange.max || '')}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: e.target.value === '' ? priceRange.max : Number(e.target.value) }
                    }))}
                    className="w-12 text-xs border-none bg-transparent focus:outline-none text-gray-700 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* 品牌块 - 全新设计 */}
              {availableBrands.length > 0 && (
                <button
                  onClick={() => {
                    setScrollToSection('brands');
                    setShowAdvancedModal(true);
                  }}
                  className="flex items-center gap-2 px-3 bg-gradient-to-br from-cyan-50/90 via-cyan-50/70 to-cyan-50/50 backdrop-blur-2xl rounded-xl border border-cyan-200/60 flex-shrink-0 shadow-sm hover:shadow-md hover:border-cyan-300/60 transition-all duration-300 group relative"
                >
                  <Smartphone className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-sm text-cyan-700 whitespace-nowrap font-medium">品牌</span>
                  <div className="flex items-center gap-1 bg-white/60 rounded-md px-2 py-0.5 border border-cyan-200/40">
                    {filters.brands.length > 0 ? (
                      <>
                        <span className="text-xs text-gray-700 font-semibold">
                          {filters.brands.length === 1 ? filters.brands[0] : `已选${filters.brands.length}个`}
                        </span>
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500">全部品牌</span>
                    )}
                  </div>
                  {/* 选中数量指示器 */}
                  {filters.brands.length > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-bounce">
                      {filters.brands.length}
                    </div>
                  )}
                </button>
              )}

              {/* 更多配置块 - 增强视觉提示 */}
              <button
                onClick={() => setShowAdvancedModal(true)}
                className="flex items-center gap-2 px-3 bg-gradient-to-br from-slate-50/90 via-slate-50/70 to-slate-50/50 backdrop-blur-2xl rounded-xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300/60 transition-all duration-300 flex-shrink-0 group relative"
              >
                <Settings className="w-4 h-4 text-slate-600 group-hover:rotate-90 group-hover:scale-110 transition-all duration-300" />
                <span className="text-sm text-slate-700 whitespace-nowrap font-medium">更多</span>
                {(filters.features.length > 0 || filters.protocols.length > 0) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </button>

              {/* 重置按钮 - 增强警示效果 */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-3 bg-gradient-to-br from-red-50/95 via-red-50/80 to-red-50/70 backdrop-blur-2xl rounded-xl border border-red-200/60 text-red-600 shadow-sm hover:shadow-md hover:border-red-300/60 hover:text-red-700 transition-all duration-300 flex-shrink-0 group"
                >
                  <X className="w-3 h-3 group-hover:rotate-90 transition-transform duration-200" />
                  <span className="text-sm whitespace-nowrap font-medium">重置</span>
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
                {/* 容量档位选择器 - 在高级弹窗中 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">容量档位</label>
                  <div className="px-3">
                    <div className="relative mb-6">
                      {/* 滑块轨道 */}
                      <div 
                        className="h-3 bg-gray-200 rounded-full relative cursor-pointer"
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newIndex = Math.round(percent * (CAPACITY_PRESETS.length - 1));
                          
                          // 判断点击的位置更接近哪个滑块
                          const distToMin = Math.abs(newIndex - capacitySlider[0]);
                          const distToMax = Math.abs(newIndex - capacitySlider[1]);
                          
                          if (distToMin <= distToMax) {
                            // 更接近最小值滑块
                            handleCapacitySliderChange([newIndex, Math.max(newIndex, capacitySlider[1])]);
                          } else {
                            // 更接近最大值滑块
                            handleCapacitySliderChange([Math.min(capacitySlider[0], newIndex), newIndex]);
                          }
                        }}
                      >
                        {/* 激活区域 */}
                        <div 
                          className="absolute h-3 bg-gray-600 rounded-full pointer-events-none"
                          style={{
                            left: `${(capacitySlider[0] / (CAPACITY_PRESETS.length - 1)) * 100}%`,
                            width: `${((capacitySlider[1] - capacitySlider[0]) / (CAPACITY_PRESETS.length - 1)) * 100}%`
                          }}
                        />
                        
                        {/* 滑块手柄 - 最小值 */}
                        <div 
                          className="absolute w-6 h-6 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(capacitySlider[0] / (CAPACITY_PRESETS.length - 1)) * 100}% - 12px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = capacitySlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([newValue, Math.max(newValue, capacitySlider[1])]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = capacitySlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([newValue, Math.max(newValue, capacitySlider[1])]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                        
                        {/* 滑块手柄 - 最大值 */}
                        <div 
                          className="absolute w-6 h-6 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(capacitySlider[1] / (CAPACITY_PRESETS.length - 1)) * 100}% - 12px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = capacitySlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([Math.min(capacitySlider[0], newValue), newValue]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = capacitySlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([Math.min(capacitySlider[0], newValue), newValue]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                      </div>
                      {/* 档位标签 */}
                      <div className="flex justify-between mt-4 px-1">
                        {CAPACITY_PRESETS.map((preset, index) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              // 点击标签可以设置为单一值
                              handleCapacitySliderChange([index, index]);
                            }}
                            className={`text-xs transition-colors cursor-pointer py-1 ${
                              index >= capacitySlider[0] && index <= capacitySlider[1]
                                ? 'text-gray-800 font-semibold'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      当前选择: {CAPACITY_PRESETS[capacitySlider[0]].label} - {CAPACITY_PRESETS[capacitySlider[1]].label}
                    </div>
                  </div>
                </div>

                {/* 功率档位选择器 - 在高级弹窗中 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">功率档位</label>
                  <div className="px-3">
                    <div className="relative mb-6">
                      {/* 滑块轨道 */}
                      <div 
                        className="h-3 bg-gray-200 rounded-full relative cursor-pointer"
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newIndex = Math.round(percent * (POWER_PRESETS.length - 1));
                          
                          // 判断点击的位置更接近哪个滑块
                          const distToMin = Math.abs(newIndex - powerSlider[0]);
                          const distToMax = Math.abs(newIndex - powerSlider[1]);
                          
                          if (distToMin <= distToMax) {
                            // 更接近最小值滑块
                            handlePowerSliderChange([newIndex, Math.max(newIndex, powerSlider[1])]);
                          } else {
                            // 更接近最大值滑块
                            handlePowerSliderChange([Math.min(powerSlider[0], newIndex), newIndex]);
                          }
                        }}
                      >
                        {/* 激活区域 */}
                        <div 
                          className="absolute h-3 bg-gray-600 rounded-full pointer-events-none"
                          style={{
                            left: `${(powerSlider[0] / (POWER_PRESETS.length - 1)) * 100}%`,
                            width: `${((powerSlider[1] - powerSlider[0]) / (POWER_PRESETS.length - 1)) * 100}%`
                          }}
                        />
                        
                        {/* 滑块手柄 - 最小值 */}
                        <div 
                          className="absolute w-6 h-6 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(powerSlider[0] / (POWER_PRESETS.length - 1)) * 100}% - 12px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = powerSlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([newValue, Math.max(newValue, powerSlider[1])]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = powerSlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([newValue, Math.max(newValue, powerSlider[1])]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                        
                        {/* 滑块手柄 - 最大值 */}
                        <div 
                          className="absolute w-6 h-6 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(powerSlider[1] / (POWER_PRESETS.length - 1)) * 100}% - 12px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = powerSlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([Math.min(powerSlider[0], newValue), newValue]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = powerSlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([Math.min(powerSlider[0], newValue), newValue]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                      </div>
                      {/* 档位标签 */}
                      <div className="flex justify-between mt-4 px-1">
                        {POWER_PRESETS.map((preset, index) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              // 点击标签可以设置为单一值
                              handlePowerSliderChange([index, index]);
                            }}
                            className={`text-xs transition-colors cursor-pointer py-1 ${
                              index >= powerSlider[0] && index <= powerSlider[1]
                                ? 'text-gray-800 font-semibold'
                                : 'text-gray-400 hover:text-gray-600'
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                      当前选择: {POWER_PRESETS[powerSlider[0]].label} - {POWER_PRESETS[powerSlider[1]].label}
                    </div>
                  </div>
                </div>

                {/* 所有品牌 */}
                {availableBrands.length > 0 && (
                  <div id="brands-section">
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
                      <label key={feature.value} className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={filters.features.includes(feature.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilters(prev => ({
                                ...prev,
                                features: [...prev.features, feature.value]
                              }));
                            } else {
                              setFilters(prev => ({
                                ...prev,
                                features: prev.features.filter(f => f !== feature.value)
                              }));
                            }
                          }}
                          className="mr-2 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{feature.label}</span>
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
                    容量档位
                  </label>
                  <div className="text-xs text-gray-500">
                    {CAPACITY_PRESETS[capacitySlider[0]].label} - {CAPACITY_PRESETS[capacitySlider[1]].label}
                  </div>
                </div>
                <div className="space-y-4">
                  {/* 容量档位选择器 */}
                  <div className="px-3">
                    <div className="relative mb-6">
                      {/* 滑块轨道 */}
                      <div 
                        className="h-2 bg-gray-200 rounded-full relative cursor-pointer"
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newIndex = Math.round(percent * (CAPACITY_PRESETS.length - 1));
                          
                          // 判断点击的位置更接近哪个滑块
                          const distToMin = Math.abs(newIndex - capacitySlider[0]);
                          const distToMax = Math.abs(newIndex - capacitySlider[1]);
                          
                          if (distToMin <= distToMax) {
                            // 更接近最小值滑块
                            handleCapacitySliderChange([newIndex, Math.max(newIndex, capacitySlider[1])]);
                          } else {
                            // 更接近最大值滑块
                            handleCapacitySliderChange([Math.min(capacitySlider[0], newIndex), newIndex]);
                          }
                        }}
                      >
                        {/* 激活区域 */}
                        <div 
                          className="absolute h-2 bg-gray-600 rounded-full pointer-events-none"
                          style={{
                            left: `${(capacitySlider[0] / (CAPACITY_PRESETS.length - 1)) * 100}%`,
                            width: `${((capacitySlider[1] - capacitySlider[0]) / (CAPACITY_PRESETS.length - 1)) * 100}%`
                          }}
                        />
                        
                        {/* 滑块手柄 - 最小值 */}
                        <div 
                          className="absolute w-5 h-5 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(capacitySlider[0] / (CAPACITY_PRESETS.length - 1)) * 100}% - 10px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = capacitySlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([newValue, Math.max(newValue, capacitySlider[1])]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = capacitySlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([newValue, Math.max(newValue, capacitySlider[1])]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                        
                        {/* 滑块手柄 - 最大值 */}
                        <div 
                          className="absolute w-5 h-5 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(capacitySlider[1] / (CAPACITY_PRESETS.length - 1)) * 100}% - 10px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = capacitySlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([Math.min(capacitySlider[0], newValue), newValue]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = capacitySlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (CAPACITY_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(CAPACITY_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handleCapacitySliderChange([Math.min(capacitySlider[0], newValue), newValue]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                      </div>
                      {/* 档位标签 */}
                      <div className="flex justify-between mt-4 px-1">
                        {CAPACITY_PRESETS.map((preset, index) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              // 点击标签可以设置为单一值
                              handleCapacitySliderChange([index, index]);
                            }}
                            className={`text-xs transition-colors cursor-pointer ${
                              index >= capacitySlider[0] && index <= capacitySlider[1]
                                ? 'text-gray-800 font-semibold'
                                : 'text-gray-400 hover:text-gray-600'
                            } ${isMobile ? 'text-[10px] py-1' : ''}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 最大功率筛选 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-gray-700">
                    最大功率档位
                  </label>
                  <div className="text-xs text-gray-500">
                    {POWER_PRESETS[powerSlider[0]].label} - {POWER_PRESETS[powerSlider[1]].label}
                  </div>
                </div>
                <div className="space-y-4">
                  {/* 功率档位选择器 */}
                  <div className="px-3">
                    <div className="relative mb-6">
                      {/* 滑块轨道 */}
                      <div 
                        className="h-2 bg-gray-200 rounded-full relative cursor-pointer"
                        onMouseDown={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const percent = (e.clientX - rect.left) / rect.width;
                          const newIndex = Math.round(percent * (POWER_PRESETS.length - 1));
                          
                          // 判断点击的位置更接近哪个滑块
                          const distToMin = Math.abs(newIndex - powerSlider[0]);
                          const distToMax = Math.abs(newIndex - powerSlider[1]);
                          
                          if (distToMin <= distToMax) {
                            // 更接近最小值滑块
                            handlePowerSliderChange([newIndex, Math.max(newIndex, powerSlider[1])]);
                          } else {
                            // 更接近最大值滑块
                            handlePowerSliderChange([Math.min(powerSlider[0], newIndex), newIndex]);
                          }
                        }}
                      >
                        {/* 激活区域 */}
                        <div 
                          className="absolute h-2 bg-gray-600 rounded-full pointer-events-none"
                          style={{
                            left: `${(powerSlider[0] / (POWER_PRESETS.length - 1)) * 100}%`,
                            width: `${((powerSlider[1] - powerSlider[0]) / (POWER_PRESETS.length - 1)) * 100}%`
                          }}
                        />
                        
                        {/* 滑块手柄 - 最小值 */}
                        <div 
                          className="absolute w-5 h-5 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(powerSlider[0] / (POWER_PRESETS.length - 1)) * 100}% - 10px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = powerSlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([newValue, Math.max(newValue, powerSlider[1])]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = powerSlider[0];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([newValue, Math.max(newValue, powerSlider[1])]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                        
                        {/* 滑块手柄 - 最大值 */}
                        <div 
                          className="absolute w-5 h-5 bg-white border-2 border-gray-600 rounded-full shadow-md -top-1.5 cursor-pointer z-20"
                          style={{ 
                            left: `calc(${(powerSlider[1] / (POWER_PRESETS.length - 1)) * 100}% - 10px)`,
                            touchAction: 'none'
                          }}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const startX = e.clientX;
                            const startValue = powerSlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleMouseMove = (e: MouseEvent) => {
                              const deltaX = e.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([Math.min(powerSlider[0], newValue), newValue]);
                            };
                            
                            const handleMouseUp = () => {
                              document.removeEventListener('mousemove', handleMouseMove);
                              document.removeEventListener('mouseup', handleMouseUp);
                            };
                            
                            document.addEventListener('mousemove', handleMouseMove);
                            document.addEventListener('mouseup', handleMouseUp);
                          }}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            const touch = e.touches[0];
                            const startX = touch.clientX;
                            const startValue = powerSlider[1];
                            const trackRect = e.currentTarget.parentElement!.getBoundingClientRect();
                            
                            const handleTouchMove = (e: TouchEvent) => {
                              const touch = e.touches[0];
                              const deltaX = touch.clientX - startX;
                              const deltaPercent = deltaX / trackRect.width;
                              const deltaSteps = deltaPercent * (POWER_PRESETS.length - 1);
                              const newValue = Math.max(0, Math.min(POWER_PRESETS.length - 1, Math.round(startValue + deltaSteps)));
                              
                              handlePowerSliderChange([Math.min(powerSlider[0], newValue), newValue]);
                            };
                            
                            const handleTouchEnd = () => {
                              document.removeEventListener('touchmove', handleTouchMove);
                              document.removeEventListener('touchend', handleTouchEnd);
                            };
                            
                            document.addEventListener('touchmove', handleTouchMove);
                            document.addEventListener('touchend', handleTouchEnd);
                          }}
                        />
                      </div>
                      {/* 档位标签 */}
                      <div className="flex justify-between mt-4 px-1">
                        {POWER_PRESETS.map((preset, index) => (
                          <button
                            key={preset.value}
                            onClick={() => {
                              // 点击标签可以设置为单一值
                              handlePowerSliderChange([index, index]);
                            }}
                            className={`text-xs transition-colors cursor-pointer ${
                              index >= powerSlider[0] && index <= powerSlider[1]
                                ? 'text-gray-800 font-semibold'
                                : 'text-gray-400 hover:text-gray-600'
                            } ${isMobile ? 'text-[10px] py-1' : ''}`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
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
                        value={filters.priceRange.min === priceRange.min ? '' : (filters.priceRange.min || '')}
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
                        value={filters.priceRange.max === priceRange.max ? '' : (filters.priceRange.max || '')}
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
                    <label key={feature.value} className={`flex items-center hover:bg-gray-50 rounded-lg cursor-pointer ${
                      isMobile ? 'p-3 border border-gray-100' : 'p-2'
                    }`}>
                      <input
                        type="checkbox"
                        checked={filters.features.includes(feature.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              features: [...prev.features, feature.value]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              features: prev.features.filter(f => f !== feature.value)
                            }));
                          }
                        }}
                        className={`rounded text-blue-600 focus:ring-blue-500 ${
                          isMobile ? 'mr-3 w-4 h-4' : 'mr-2'
                        }`}
                      />
                      <span className="text-sm text-gray-700 flex-1">{feature.label}</span>
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
