'use client';

import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, Battery, Trophy } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { BackButton } from '@/components/ui/back-button';
import { TitleWithTooltip } from '@/components/ui/title-with-tooltip';

interface CompareInterfaceProps {
  chargeBabies: ChargeBaby[];
  searchParams?: {
    product?: string;
    from?: string;
  };
}

const gradeLabels = ['入门级', '进阶级', '高端级', '旗舰级', '超旗舰级'];
const perfLevelLabels = ['低性能', '中性能', '中高性能', '高性能', '超高性能'];
const expLevelLabels = ['低水平', '中水平', '中高水平', '高水平', '超高水平'];

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
      product.model !== 'WeChat' && 
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
      <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl py-6 sm:py-8">
        <div className={`grid gap-6 sm:gap-8 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {displayedProducts.map((product, index) => (
            <ProductDisplay key={index} product={product} isMobile={isMobile} />
          ))}
        </div>
      </div>

      {/* 详细对比表格 */}
      {hasValidComparison && (
        <div className="bg-white">
          <div className="container px-4 sm:px-6 lg:px-8 max-w-6xl py-6 sm:py-8">
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
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  const normalizedTerm = searchTerm.trim().toLowerCase();
  const filteredProducts = normalizedTerm
    ? availableProducts.filter((product) => {
        const candidateTexts = [
          product.displayName,
          product.title,
          product.brand,
          product.model,
        ];
        return candidateTexts.some((text) => text?.toLowerCase().includes(normalizedTerm));
      })
    : availableProducts;

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
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-40 max-h-80 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input
                ref={searchInputRef}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="搜索型号、品牌..."
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-gray-400 focus:ring-0"
              />
            </div>
            <div className="p-2 overflow-y-auto">
              <button
                onClick={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="w-full p-3 text-left hover:bg-gray-50 rounded-lg transition-colors text-gray-500 text-sm"
              >
                不选择
              </button>
              {filteredProducts.length === 0 && (
                <div className="px-3 py-4 text-center text-sm text-gray-400">
                  未找到匹配的充电宝
                </div>
              )}
              {filteredProducts.map((product) => (
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
        {/* 灰色的查看详情按钮 */}
        <div className="mt-4 sm:mt-6">
          <button 
            disabled 
            className="w-full py-2.5 px-4 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-500 font-medium rounded-lg cursor-not-allowed"
          >
            查看详情
          </button>
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
            enableZoom
          />
        ) : (
          <Battery className={`text-gray-300 ${isMobile ? 'w-16 h-16' : 'w-20 h-20 sm:w-24 sm:h-24'}`} />
        )}
      </div>

      {/* 产品信息 */}
      <div className="space-y-1 sm:space-y-2">
        <Link href={`/${encodeURIComponent(product.model)}`} className="block hover:opacity-80 transition-opacity">
          <h3 className={`font-bold text-gray-900 hover:text-blue-600 transition-colors ${isMobile ? 'text-sm line-clamp-2' : 'text-lg sm:text-xl'}`}>
            {product.displayName || product.title}
          </h3>
        </Link>
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
        {/* 查看详情按钮 */}
        <div className="pt-2 sm:pt-3">
          <Link href={`/${encodeURIComponent(product.model)}`} className="block">
            <button className="w-full py-2.5 px-4 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-medium rounded-lg transition-all duration-200">
              查看详情
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function CompactCircularRating({ value = 0, size = 72, strokeWidth = 5, children }: { value?: number; size?: number; strokeWidth?: number; children?: ReactNode }) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="-rotate-90 transform" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#4b5563"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ?? (
          <>
            <span className="text-lg font-semibold text-gray-900 leading-none">{Math.round(clampedValue)}</span>
            <span className="text-[10px] text-gray-400">/100</span>
          </>
        )}
      </div>
    </div>
  );
}

function CompactProgressSegmentBar({ value = 0, labels, labelsOnTop = false }: { value?: number; labels: string[]; labelsOnTop?: boolean }) {
  const clamped = Math.max(0, Math.min(100, value));
  const count = labels.length;
  const activeIndex = Math.min(count - 1, Math.floor(clamped / (100 / count)));
  const segmentWidth = 100 / count;

  return (
    <div className="space-y-1">
      {labelsOnTop && (
        <div className="mb-1 flex justify-between text-[10px] text-gray-400">
          {labels.map((label, index) => (
            <span key={label} className={index === activeIndex ? 'text-gray-700 font-medium' : undefined}>
              {label}
            </span>
          ))}
        </div>
      )}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        {Array.from({ length: count - 1 }).map((_, index) => (
          <div
            key={index}
            className="absolute top-0 bottom-0 w-px bg-white/60"
            style={{ left: `${(index + 1) * segmentWidth}%` }}
          />
        ))}
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-gray-700 via-gray-700 to-gray-500"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {!labelsOnTop && (
        <div className="flex justify-between text-[10px] text-gray-400">
          {labels.map((label, index) => (
            <span key={label} className={index === activeIndex ? 'text-gray-700 font-medium' : undefined}>
              {label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScoreComparisonCard({ product }: { product: ChargeBaby | null }) {
  const overallScore = product?.overallRating ?? null;

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <OverallScoreBlock score={overallScore} />
      <DetailedScoreBlock
        title="性能评分"
        score={product?.performanceRating ?? null}
        labels={perfLevelLabels}
        metrics={[
          { label: '自充能力', value: product?.selfChargingCapability ?? null, max: 40 },
          { label: '输出能力', value: product?.outputCapability ?? null, max: 35 },
          { label: '能量', value: product?.energy ?? null, max: 20 },
        ]}
      />
      <DetailedScoreBlock
        title="体验评分"
        score={product?.experienceRating ?? null}
        labels={expLevelLabels}
        metrics={[
          { label: '便携性', value: product?.portability ?? null, max: 40 },
          { label: '充电协议', value: product?.chargingProtocols ?? null, max: 30 },
          { label: '多接口使用', value: product?.multiPortUsage ?? null, max: 20 },
        ]}
      />
    </div>
  );
}

function OverallScoreBlock({ score }: { score?: number | null }) {
  const hasScore = score != null;
  const normalizedScore = hasScore ? Math.max(0, Math.min(100, score as number)) : 0;
  const gradeLabel = hasScore
    ? gradeLabels[Math.min(gradeLabels.length - 1, Math.floor(normalizedScore / 20))]
    : '--';

  return (
    <div className="aspect-square rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col">
      <div className="flex flex-1 items-center justify-center">
        <CompactCircularRating value={normalizedScore} size={180} strokeWidth={8}>
          {hasScore ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs font-medium text-gray-600">综合评分</span>
              <span className="text-4xl font-bold text-gray-900 leading-none">
                {Math.round(normalizedScore)}
              </span>
              <span className="text-xs font-medium text-gray-500">{gradeLabel}</span>
            </div>
          ) : (
            <span className="text-sm text-gray-400">--</span>
          )}
        </CompactCircularRating>
      </div>
    </div>
  );
}

function DetailedScoreBlock({
  title,
  score,
  labels,
  metrics,
}: {
  title: string;
  score?: number | null;
  labels: string[];
  metrics: { label: string; value?: number | null; max: number }[];
}) {
  const hasScore = score != null;
  const normalizedScore = hasScore ? Math.max(0, Math.min(100, score as number)) : 0;
  const levelLabel = hasScore
    ? labels[Math.min(labels.length - 1, Math.floor(normalizedScore / 20))]
    : '--';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-900">{title}</span>
        {hasScore ? (
          <div className="flex items-baseline gap-1 text-gray-900">
            <span className="text-2xl font-bold">{formatNumber(normalizedScore)}</span>
            <span className="text-sm text-gray-400">/100</span>
          </div>
        ) : (
          <span className="text-sm text-gray-400">--</span>
        )}
      </div>

      {hasScore && (
        <>
          <CompactProgressSegmentBar value={normalizedScore} labels={labels} labelsOnTop />
          <div className="text-[11px] text-gray-500">{levelLabel}</div>
        </>
      )}

      <div className="h-px bg-gray-100" />

      <div className="space-y-2">
        {metrics.map((metric) => (
          <MetricRow key={metric.label} label={metric.label} value={metric.value} max={metric.max} />
        ))}
      </div>
    </div>
  );
}

function MetricRow({ label, value, max }: { label: string; value?: number | null; max: number }) {
  const hasValue = value != null;
  const safeValue = hasValue ? Math.max(0, Math.min(max, value as number)) : 0;
  const progress = getMetricProgress(value, max);

  return (
    <div>
      <div className="flex items-center justify-between text-[12px] text-gray-600">
        <TitleWithTooltip title={label} />
        {hasValue ? (
          <span className="font-medium text-gray-800">{formatNumber(safeValue)}/{max}</span>
        ) : (
          <span className="text-gray-400">--</span>
        )}
      </div>
      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div className="h-full bg-gray-600" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

function getMetricProgress(value: number | null | undefined, max: number) {
  if (value == null || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

// 格式化数字，保留最多两位小数
function formatNumber(num: number): number {
  if (num === 0 || !num) return 0;
  return Math.round(num * 100) / 100;
}

// 通用数据卡片组件
interface DataItem {
  label: string;
  value: string;
}

function DataCard({ 
  title, 
  items, 
  isEmpty = false 
}: { 
  title: string; 
  items: DataItem[]; 
  isEmpty?: boolean;
}) {
  if (isEmpty) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-gray-50/50 p-8 flex items-center justify-center min-h-[280px] transition-all hover:border-gray-300">
        <span className="text-gray-400 text-lg">-</span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300">
      <h3 className="text-base font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">{title}</h3>
      <div className="space-y-6">
        {items.map((item) => (
          <div key={item.label}>
            <div className="text-xs font-medium text-gray-500 mb-2.5 uppercase tracking-wide">
              <TitleWithTooltip title={item.label} />
            </div>
            <div className="text-2xl font-bold text-gray-900 leading-tight">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PhysicalSpecsCard({ product }: { product: ChargeBaby | null }) {
  if (!product?.detailData) {
    return <DataCard title="物理规格" items={[]} isEmpty={true} />;
  }

  const { detailData } = product;
  const items: DataItem[] = [
    {
      label: '尺寸',
      value: detailData.length && detailData.width && detailData.thickness
        ? `${formatNumber(detailData.length)} x ${formatNumber(detailData.width)} x ${formatNumber(detailData.thickness)} cm`
        : '-'
    },
    {
      label: '重量',
      value: detailData.weight ? `${formatNumber(detailData.weight)}g` : '-'
    },
    {
      label: '体积',
      value: detailData.volume ? `${formatNumber(detailData.volume)}cm³` : '-'
    },
    {
      label: '能量重量比',
      value: detailData.capacityWeightRatio ? `${formatNumber(detailData.capacityWeightRatio)}Wh/g` : '-'
    },
    {
      label: '能量体积比',
      value: detailData.capacityVolumeRatio ? `${formatNumber(detailData.capacityVolumeRatio)}Wh/cm³` : '-'
    }
  ];

  return <DataCard title="物理规格" items={items} />;
}

function BasicInfoCard({ product }: { product: ChargeBaby | null }) {
  if (!product) {
    return <DataCard title="基本信息" items={[]} isEmpty={true} />;
  }

  const items: DataItem[] = [
    {
      label: '型号',
      value: product.brand && product.model ? `${product.brand} ${product.model}` : (product.model || '-')
    },
    {
      label: '发布时间',
      value: product.releaseDate ? (() => {
        const d = new Date(product.releaseDate);
        return `${d.getFullYear()}年${d.getMonth() + 1}月`;
      })() : '-'
    },
    {
      label: '官方定价',
      value: product.price ? `¥${Math.round(product.price)}` : '-'
    }
  ];

  return <DataCard title="基本信息" items={items} />;
}

function BatteryCapacityCard({ product }: { product: ChargeBaby | null }) {
  if (!product?.detailData) {
    return <DataCard title="电池容量" items={[]} isEmpty={true} />;
  }

  const { detailData } = product;
  const items: DataItem[] = [
    {
      label: '容量级别',
      value: detailData.capacityLevel ? `${formatNumber(detailData.capacityLevel)}mAh` : '-'
    },
    {
      label: '最大放电能量',
      value: detailData.maxDischargeCapacity ? `${formatNumber(detailData.maxDischargeCapacity)}Wh` : '-'
    },
    {
      label: '自充能量',
      value: detailData.selfChargingEnergy ? `${formatNumber(detailData.selfChargingEnergy)}Wh` : '-'
    }
  ];

  return <DataCard title="电池容量" items={items} />;
}

function ChargingPerformanceCard({ product }: { product: ChargeBaby | null }) {
  if (!product?.detailData) {
    return <DataCard title="充电性能" items={[]} isEmpty={true} />;
  }

  const { detailData } = product;
  const items: DataItem[] = [
    {
      label: '最大自充电功率',
      value: detailData.maxSelfChargingPower ? `${formatNumber(detailData.maxSelfChargingPower)}W` : '-'
    },
    {
      label: '自充电时间',
      value: detailData.selfChargingTime ? `${formatNumber(detailData.selfChargingTime)}分钟` : '-'
    },
    {
      label: '平均自充电功率',
      value: detailData.avgSelfChargingPower ? `${formatNumber(detailData.avgSelfChargingPower)}W` : '-'
    }
  ];

  return <DataCard title="充电性能" items={items} />;
}

function OutputPerformanceCard({ product }: { product: ChargeBaby | null }) {
  if (!product?.detailData) {
    return <DataCard title="输出性能" items={[]} isEmpty={true} />;
  }

  const { detailData } = product;
  const items: DataItem[] = [
    {
      label: '最大输出功率',
      value: detailData.maxOutputPower ? `${formatNumber(detailData.maxOutputPower)}W` : '-'
    },
    {
      label: '最大持续输出功率',
      value: detailData.maxContinuousOutputPower ? `${formatNumber(detailData.maxContinuousOutputPower)}W` : '-'
    }
  ];

  return <DataCard title="输出性能" items={items} />;
}

function PerformanceParamsCard({ product }: { product: ChargeBaby | null }) {
  if (!product) {
    return <DataCard title="性能参数" items={[]} isEmpty={true} />;
  }

  const items: DataItem[] = [
    {
      label: '自充能力',
      value: product.selfChargingCapability != null ? `${formatNumber(product.selfChargingCapability)}/40` : '-'
    },
    {
      label: '输出能力',
      value: product.outputCapability != null ? `${formatNumber(product.outputCapability)}/35` : '-'
    },
    {
      label: '能量',
      value: product.energy != null ? `${formatNumber(product.energy)}/20` : '-'
    }
  ];

  return <DataCard title="性能参数" items={items} />;
}

function ExperienceParamsCard({ product }: { product: ChargeBaby | null }) {
  if (!product) {
    return <DataCard title="体验参数" items={[]} isEmpty={true} />;
  }

  const items: DataItem[] = [
    {
      label: '便携性',
      value: product.portability != null ? `${formatNumber(product.portability)}/40` : '-'
    },
    {
      label: '充电协议',
      value: product.chargingProtocols != null ? `${formatNumber(product.chargingProtocols)}/30` : '-'
    },
    {
      label: '多接口使用',
      value: product.multiPortUsage != null ? `${formatNumber(product.multiPortUsage)}/20` : '-'
    }
  ];

  return <DataCard title="体验参数" items={items} />;
}

function DataSourceCard({ product }: { product: ChargeBaby | null }) {
  if (!product) {
    return <DataCard title="数据来源" items={[]} isEmpty={true} />;
  }

  const items: DataItem[] = [
    {
      label: '数据来源',
      value: product.detailData?.dataSource || '-'
    },
    {
      label: '样机提供方',
      value: product.productSource || '-'
    }
  ];

  return <DataCard title="数据来源" items={items} />;
}

function ComparisonTable({ products, isMobile }: { products: (ChargeBaby | null)[]; isMobile?: boolean }) {
  const maxColumns = isMobile ? 2 : 3;
  
  // 渲染对应类别的卡片组件
  const renderCategoryCards = (categoryName: string) => {
    return (
      <div className={`grid gap-4 sm:gap-5 md:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        {Array.from({ length: maxColumns }, (_, index) => {
          const product = products[index];
          
          switch (categoryName) {
            case '基本信息':
              return <BasicInfoCard key={product?.id ?? index} product={product} />;
            case '物理规格':
              return <PhysicalSpecsCard key={product?.id ?? index} product={product} />;
            case '性能参数':
              return <PerformanceParamsCard key={product?.id ?? index} product={product} />;
            case '体验参数':
              return <ExperienceParamsCard key={product?.id ?? index} product={product} />;
            case '电池容量':
              return <BatteryCapacityCard key={product?.id ?? index} product={product} />;
            case '充电性能':
              return <ChargingPerformanceCard key={product?.id ?? index} product={product} />;
            case '输出性能':
              return <OutputPerformanceCard key={product?.id ?? index} product={product} />;
            case '数据来源':
              return <DataSourceCard key={product?.id ?? index} product={product} />;
            default:
              return null;
          }
        })}
      </div>
    );
  };
  
  const categories = [
    '基本信息',
    '物理规格',
    '性能参数',
    '体验参数',
    '电池容量',
    '充电性能',
    '输出性能',
    '数据来源'
  ];
  
  return (
    <div className={`${isMobile ? 'space-y-6' : 'space-y-8'}`}>
      {/* 综合评分卡片 - 显示在最前面 */}
      <div>
        <div className={`grid gap-4 sm:gap-5 md:gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {Array.from({ length: maxColumns }, (_, index) => {
            const product = products[index];
            return <ScoreComparisonCard key={product?.id ?? index} product={product} />;
          })}
        </div>
      </div>

      {/* 其他类别卡片 */}
      {categories.map((categoryName) => (
        <div key={categoryName}>
          {renderCategoryCards(categoryName)}
        </div>
      ))}
    </div>
  );
}
