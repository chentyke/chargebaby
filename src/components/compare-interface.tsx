'use client';

import { useState, useEffect } from 'react';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Battery, Trophy } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { BackButton } from '@/components/ui/back-button';

interface CompareInterfaceProps {
  chargeBabies: ChargeBaby[];
  searchParams?: {
    product?: string;
    from?: string;
  };
}

export function CompareInterface({ chargeBabies, searchParams }: CompareInterfaceProps) {
  const [selectedProducts, setSelectedProducts] = useState<(ChargeBaby | null)[]>([null, null, null]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // 初始化时预填充产品
  useEffect(() => {
    if (searchParams?.product && chargeBabies.length > 0) {
      const prefilledProduct = chargeBabies.find(cb => cb.model === decodeURIComponent(searchParams.product!));
      if (prefilledProduct) {
        setSelectedProducts([prefilledProduct, null, null]);
      }
    }
  }, [chargeBabies, searchParams?.product]);

  const maxProducts = isMobile ? 2 : 3;
  const displayedProducts = isMobile ? selectedProducts.slice(0, 2) : selectedProducts;

  const updateProduct = (index: number, product: ChargeBaby | null) => {
    const newProducts = [...selectedProducts];
    newProducts[index] = product;
    setSelectedProducts(newProducts);
  };

  const availableProducts = (excludeIndex: number) => 
    chargeBabies.filter(product => 
      !displayedProducts.some((selected, i) => i !== excludeIndex && selected?.id === product.id)
    );

  const hasValidComparison = displayedProducts.filter(p => p !== null).length >= 2;

  // 决定返回链接
  const backHref = searchParams?.from === 'detail' && searchParams?.product 
    ? `/${encodeURIComponent(searchParams.product)}` 
    : '/';
  const backText = searchParams?.from === 'detail' ? '返回详情' : '返回首页';

  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航 */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <BackButton href={backHref} variant="compact">
            {backText}
          </BackButton>
          
          {/* 排行榜按钮 */}
          <Link href="/ranking">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-xl rounded-xl border border-gray-200 shadow-sm text-orange-600 hover:text-orange-700 hover:bg-orange-50/50 transition-all duration-300">
              <Trophy className="w-5 h-5" />
              <span className="font-medium text-sm">排行榜</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 主标题区域 */}
      <div className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-12">
          充电宝对比
        </h1>
      </div>

      {/* 粘性选择器区域 */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl">
        <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl py-4">
          <div className={`grid gap-4 sm:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
            {displayedProducts.map((selectedProduct, index) => (
              <ProductSelector
                key={index}
                selectedProduct={selectedProduct}
                availableProducts={availableProducts(index)}
                onSelect={(product) => updateProduct(index, product)}
                position={index}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 产品展示区域 */}
      <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl py-8 sm:py-16">
        <div className={`grid gap-6 sm:gap-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {displayedProducts.map((product, index) => (
            <ProductDisplay key={index} product={product} isMobile={isMobile} />
          ))}
        </div>
      </div>

      {/* 详细对比表格 */}
      {hasValidComparison && (
        <div className="bg-white">
          <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl py-8 sm:py-16">
            <ComparisonTable products={displayedProducts} isMobile={isMobile} />
          </div>
        </div>
      )}
    </div>
  );
}

function ProductSelector({ 
  selectedProduct, 
  availableProducts, 
  onSelect, 
  position,
  isMobile 
}: {
  selectedProduct: ChargeBaby | null;
  availableProducts: ChargeBaby[];
  onSelect: (product: ChargeBaby | null) => void;
  position: number;
  isMobile?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 sm:p-4 bg-white border border-gray-300 rounded-xl hover:border-gray-400 transition-colors text-left flex items-center justify-between shadow-sm"
      >
        <span className="font-medium text-gray-900 text-xs sm:text-sm md:text-base truncate pr-2">
          {selectedProduct ? (selectedProduct.displayName || selectedProduct.title) : `选择充电宝 ${position + 1}`}
        </span>
        <ChevronDown className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-40 max-h-80 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-500 text-sm"
              >
                不选择
              </button>
              {availableProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelect(product);
                    setIsOpen(false);
                  }}
                  className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    {product.imageUrl ? (
                      <NotionImage
                        src={product.imageUrl}
                        alt={product.title}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    ) : (
                      <Battery className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate text-sm">
                      {product.displayName || product.title}
                    </div>
                    {(product.brand || product.model) && (
                      <div className="text-xs text-gray-500 truncate">
                        {product.brand && product.model ? `${product.brand} ${product.model}` : (product.model || product.brand)}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductDisplay({ product, isMobile }: { product: ChargeBaby | null; isMobile?: boolean }) {
  if (!product) {
    return (
      <div className="text-center">
        <div className={`aspect-square bg-gray-50 rounded-3xl mb-4 sm:mb-6 flex items-center justify-center border-2 border-dashed border-gray-200 ${isMobile ? 'p-4' : 'p-6 sm:p-8'}`}>
          <div className="text-center text-gray-400">
            <Battery className={`mx-auto mb-2 sm:mb-4 ${isMobile ? 'w-12 h-12' : 'w-14 h-14 sm:w-16 sm:h-16'}`} />
            <p className={`${isMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>选择充电宝</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center">
      {/* 产品图片 */}
      <div className={`aspect-square bg-gray-50 rounded-3xl mb-4 sm:mb-6 ${isMobile ? 'p-4' : 'p-6 sm:p-8'} flex items-center justify-center`}>
        {product.imageUrl ? (
          <NotionImage
            src={product.imageUrl}
            alt={product.title}
            width={isMobile ? 200 : 300}
            height={isMobile ? 200 : 300}
            className="object-contain w-full h-full"
          />
        ) : (
          <Battery className={`text-gray-300 ${isMobile ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'}`} />
        )}
      </div>

      {/* 产品信息 */}
      <div className="space-y-1 sm:space-y-2">
        <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-sm line-clamp-2' : 'text-lg sm:text-xl'}`}>
          {product.displayName || product.title}
        </h3>
        {(product.brand || product.model) && (
          <p className={`text-gray-600 ${isMobile ? 'text-xs truncate' : 'text-sm sm:text-base'}`}>
            {product.brand && product.model ? `${product.brand} ${product.model}` : (product.model || product.brand)}
          </p>
        )}
        {product.price && (
          <p className={`font-semibold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
            ¥{Math.round(product.price)}
          </p>
        )}
        {product.overallRating && (
          <div className={`inline-flex items-center gap-1 sm:gap-2 bg-purple-50 rounded-full ${isMobile ? 'px-2 py-1' : 'px-3 sm:px-4 py-1 sm:py-2'}`}>
            <span className={`text-purple-600 ${isMobile ? 'text-xs' : 'text-xs sm:text-sm'}`}>综合评分</span>
            <span className={`font-bold ${isMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>
              <span className="text-purple-600">{Math.round(product.overallRating)}</span><span className={`text-gray-400 ${isMobile ? 'text-xs' : 'text-sm'}`}>/100</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonTable({ products, isMobile }: { products: (ChargeBaby | null)[]; isMobile?: boolean }) {
  const comparisonData = [
    {
      category: "基本信息",
      items: [
        { label: "型号", key: "model", format: (model: any, product: any) => {
          if (!product) return '-';
          const brand = product.brand;
          const modelName = model || product.model;
          return brand && modelName ? `${brand} ${modelName}` : (modelName || '-');
        }},
        { label: "发布时间", key: "releaseDate", format: (date: any) => {
          if (!date) return '-';
          const d = new Date(date);
          return `${d.getFullYear()}年${d.getMonth() + 1}月`;
        }},
        { label: "官方定价", key: "price", format: (price: any) => price ? `¥${Math.round(price)}` : '-' },
      ]
    },
    {
      category: "综合评分",
      items: [
        { label: "综合评分", key: "overallRating", format: (rating: any) => rating ? { score: Math.round(rating), isRating: true } : '-' },
        { label: "性能评分", key: "performanceRating", format: (rating: any) => rating ? { score: Math.round(rating), isRating: true } : '-' },
        { label: "体验评分", key: "experienceRating", format: (rating: any) => rating ? { score: Math.round(rating), isRating: true } : '-' },
      ]
    },
    {
      category: "性能参数",
      items: [
        { label: "自充能力", key: "selfChargingCapability", format: (val: any) => val ? { score: val, max: 40, isRating: true } : '-' },
        { label: "输出能力", key: "outputCapability", format: (val: any) => val ? { score: val, max: 35, isRating: true } : '-' },
        { label: "能量", key: "energy", format: (val: any) => val ? { score: val, max: 20, isRating: true } : '-' },
      ]
    },
    {
      category: "体验参数",
      items: [
        { label: "便携性", key: "portability", format: (val: any) => val ? { score: val, max: 40, isRating: true } : '-' },
        { label: "充电协议", key: "chargingProtocols", format: (val: any) => val ? { score: val, max: 30, isRating: true } : '-' },
        { label: "多接口使用", key: "multiPortUsage", format: (val: any) => val ? { score: val, max: 20, isRating: true } : '-' },
      ]
    },
    {
      category: "物理规格",
      items: [
        { label: "重量", key: "detailData.weight", format: (val: any, product: any) => product?.detailData?.weight ? `${product.detailData.weight}g` : '-' },
        { label: "体积", key: "detailData.volume", format: (val: any, product: any) => product?.detailData?.volume ? `${product.detailData.volume}cm³` : '-' },
        { label: "能量重量比", key: "detailData.energyWeightRatio", format: (val: any, product: any) => {
          const ratio = product?.detailData?.energyWeightRatio || product?.detailData?.capacityWeightRatio;
          return ratio ? `${ratio} Wh/g` : '-';
        }},
      ]
    },
    {
      category: "电池容量",
      items: [
        { label: "容量级别", key: "detailData.capacityLevel", format: (val: any, product: any) => product?.detailData?.capacityLevel ? `${product.detailData.capacityLevel}mAh` : '-' },
        { label: "最大放电能量", key: "detailData.maxDischargeCapacity", format: (val: any, product: any) => product?.detailData?.maxDischargeCapacity ? `${product.detailData.maxDischargeCapacity}Wh` : '-' },
        { label: "自充能量", key: "detailData.selfChargingEnergy", format: (val: any, product: any) => product?.detailData?.selfChargingEnergy ? `${product.detailData.selfChargingEnergy}Wh` : '-' },
      ]
    },
    {
      category: "充电性能",
      items: [
        { label: "最大自充电功率", key: "detailData.maxSelfChargingPower", format: (val: any, product: any) => product?.detailData?.maxSelfChargingPower ? `${product.detailData.maxSelfChargingPower}W` : '-' },
        { label: "自充电时间", key: "detailData.selfChargingTime", format: (val: any, product: any) => product?.detailData?.selfChargingTime ? `${product.detailData.selfChargingTime}分钟` : '-' },
        { label: "平均自充电功率", key: "detailData.avgSelfChargingPower", format: (val: any, product: any) => product?.detailData?.avgSelfChargingPower ? `${product.detailData.avgSelfChargingPower}W` : '-' },
      ]
    },
    {
      category: "输出性能",
      items: [
        { label: "最大输出功率", key: "detailData.maxOutputPower", format: (val: any, product: any) => product?.detailData?.maxOutputPower ? `${product.detailData.maxOutputPower}W` : '-' },
        { label: "最大持续输出功率", key: "detailData.maxContinuousOutputPower", format: (val: any, product: any) => product?.detailData?.maxContinuousOutputPower ? `${product.detailData.maxContinuousOutputPower}W` : '-' },
      ]
    }
  ];

  const maxColumns = isMobile ? 2 : 3;
  
  return (
    <div className={`${isMobile ? 'space-y-12' : 'space-y-16 sm:space-y-20'}`}>
      {comparisonData.map((category) => (
        <div key={category.category}>
          <h2 className={`font-bold text-gray-900 mb-6 sm:mb-8 md:mb-10 text-center ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'}`}>
            {category.category}
          </h2>
          
          <div className={`${isMobile ? 'space-y-4' : 'space-y-6 sm:space-y-8'}`}>
            {category.items.map((item) => (
              <div key={item.key}>
                <h3 className={`font-semibold text-gray-700 mb-3 sm:mb-4 ${isMobile ? 'text-sm' : 'text-base sm:text-lg'}`}>
                  {item.label}
                </h3>
                
                <div className={`grid gap-3 sm:gap-4 md:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                  {/* 按选择器的顺序显示产品 */}
                  {Array.from({ length: maxColumns }, (_, index) => {
                    const product = products[index];
                    if (!product) {
                      return (
                        <div key={index} className="text-center">
                          <div className={`bg-gray-50 border border-gray-200 rounded-xl sm:rounded-2xl ${isMobile ? 'p-4 py-8' : 'p-6 py-10 sm:py-12'} flex items-center justify-center`}>
                            <div className={`text-gray-400 ${isMobile ? 'text-2xl' : 'text-3xl sm:text-4xl'} font-light`}>
                              -
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    const value = (product as any)[item.key];
                    const displayValue = item.format ? item.format(value, product) : value || '-';
                    
                    return (
                      <div key={product.id} className="text-center">
                        <div className={`bg-white border border-gray-200 rounded-xl sm:rounded-2xl ${isMobile ? 'p-4 py-8' : 'p-6 py-10 sm:py-12'} flex items-center justify-center`}>
                          <div className={`font-bold ${isMobile ? 'text-xl' : 'text-2xl sm:text-3xl lg:text-4xl'}`}>
                            {typeof displayValue === 'object' && displayValue?.isRating ? (
                              <>
                                <span className="text-gray-900">{displayValue.score}</span>
                                <span className={`text-gray-400 ${isMobile ? 'text-sm' : 'text-base sm:text-lg lg:text-xl'}`}>/{displayValue.max || 100}</span>
                              </>
                            ) : (
                              <span className="text-gray-900">{displayValue}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}