import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ChargeBaby, SortOption } from '@/types/chargebaby';
import { cn } from '@/lib/utils';
import { NotionImage } from './notion-image';
import { saveScrollPosition, getStoredViewMode } from '@/utils/view-mode-storage';
import type { ReactNode } from 'react';

interface ChargeBabyListCardProps {
  chargeBaby: ChargeBaby;
  className?: string;
  index?: number;
  sortBy?: SortOption;
  hasActiveFilters?: boolean;
  currentViewMode?: 'grid' | 'list';
}

export function ChargeBabyListCard({ chargeBaby, className, index = 0, sortBy, hasActiveFilters = false, currentViewMode }: ChargeBabyListCardProps) {
  const {
    id,
    brand,
    model,
    title,
    displayName,
    imageUrl,
    price,
    overallRating,
    updatedAt,
    detailData,
    tags,
  } = chargeBaby;

  const router = useRouter();
  const pathname = usePathname();

  // 处理导航到详情页面
  const handleNavigation = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // 保存当前滚动位置
    const viewMode = currentViewMode || getStoredViewMode();
    saveScrollPosition(pathname, viewMode);
    
    // 导航到详情页面，携带必要的参数
    const detailUrl = `/${encodeURIComponent(model)}?view=${viewMode}`;
    router.push(detailUrl);
  };

  // 格式化数字，保留最多两位小数
  const formatNumber = (num: number): number => {
    if (num === 0 || !num) return 0;
    return Math.round(num * 100) / 100;
  };

  // 获取容量信息
  const getCapacityInfo = () => {
    const capacity = detailData?.capacityLevel;
    if (!capacity) return null;
    return `${Math.round(capacity)} mAh`;
  };

  // 获取功率信息
  const getPowerInfo = (): ReactNode | null => {
    const maxSelfCharging = detailData?.maxSelfChargingPower || 0;
    const maxOutput = detailData?.maxOutputPower || 0;

    if (!maxSelfCharging && !maxOutput) return null;

    const parts: ReactNode[] = [];

    if (maxSelfCharging) {
      parts.push(
        <span key="in">{`${formatNumber(maxSelfCharging)}W(IN)`}</span>
      );
    }

    if (maxSelfCharging && maxOutput) {
      parts.push(
        <span key="separator" className="mx-1 text-gray-400 font-normal">
          ｜
        </span>
      );
    }

    if (maxOutput) {
      parts.push(
        <span key="out">{`${formatNumber(maxOutput)}W(OUT)`}</span>
      );
    }

    return <>{parts}</>;
  };

  // 获取评分颜色 - 仅使用黑灰色调
  const getRatingColor = (rating: number) => {
    if (rating >= 8) return 'text-gray-900 font-semibold';
    if (rating >= 6) return 'text-gray-700 font-medium';
    return 'text-gray-500';
  };

  return (
    <Link href={`/${encodeURIComponent(model)}`} onClick={handleNavigation}>
      <div 
        className={cn(
          "group relative bg-white hover:bg-gray-50 transition-all duration-200",
          "p-4 flex items-start gap-4",
          "animate-slide-up",
          className
        )}
        style={{ 
          animationDelay: hasActiveFilters ? '0ms' : `${Math.min(index * 50, 500)}ms` 
        }}
      >
        {/* 产品图片 - 更小尺寸 */}
        <div className="flex-shrink-0 w-12 h-12 bg-gray-50 rounded-md overflow-hidden">
          {imageUrl ? (
            <NotionImage 
              src={imageUrl}
              alt={displayName || title}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              priority={index < 8}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-xs">暂无</span>
            </div>
          )}
        </div>

        {/* 产品信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-stretch justify-between gap-4 min-h-full">
            {/* 左侧主要信息 */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* 产品名称和Model */}
              <div>
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 truncate">
                  {displayName || title}
                </h3>
                {model && (
                  <p className="text-xs text-gray-500 font-medium">{model}</p>
                )}
              </div>

              {/* 详细规格信息 - 分行展示更多信息 */}
              <div className="space-y-1">
                {/* 容量和功率信息 */}
                <div className="flex items-center gap-4 text-xs">
                  {getCapacityInfo() && (
                    <div className="flex items-center gap-1">
                      <span className="text-gray-400">容量</span>
                      <span className="font-semibold text-gray-700">{getCapacityInfo()}</span>
                    </div>
                  )}
                </div>
                {getPowerInfo() && (
                  <div className="flex items-center text-xs">
                    <span className="text-gray-400">功率</span>
                    <span className="ml-1 font-semibold text-gray-700">
                      {getPowerInfo()}
                    </span>
                  </div>
                )}

                {/* 标签信息 */}
                {(detailData?.weight || (tags && Array.isArray(tags) && tags.length > 0)) && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-gray-400">标签</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {/* 重量标签放在最前面 */}
                      {detailData?.weight && detailData.weight > 0 && (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          {formatNumber(detailData.weight)}g
                        </span>
                      )}
                      {/* 过滤掉包含mAh和Max的标签，最多显示2个 */}
                      {tags && Array.isArray(tags) && 
                        tags
                          .filter(tag => !tag.toLowerCase().includes('mah') && !tag.toLowerCase().includes('max'))
                          .slice(0, 2)
                          .map((tag, tagIndex) => (
                            <span key={tagIndex} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                              {tag}
                            </span>
                          ))}
                      {/* 显示剩余标签数量 */}
                      {tags && Array.isArray(tags) && tags.filter(tag => !tag.toLowerCase().includes('mah') && !tag.toLowerCase().includes('max')).length > 2 && (
                        <span className="text-gray-400">+{tags.filter(tag => !tag.toLowerCase().includes('mah') && !tag.toLowerCase().includes('max')).length - 2}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 右侧价格和评分 */}
            <div className="flex flex-col justify-between items-end flex-shrink-0 text-right min-h-full">
              {/* 价格 */}
              {price && (
                <div className="text-base font-bold text-gray-900">
                  ¥{price}
                </div>
              )}
              
              {/* 评分 - 贴底部 */}
              {overallRating > 0 && (
                <div className="text-center">
                  <div className="text-xs text-gray-400 mb-1">综合评分</div>
                  <div className={cn(
                    "text-lg font-bold",
                    getRatingColor(overallRating)
                  )}>
                    {formatNumber(overallRating)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hover 状态指示器 - 使用灰色 */}
        <div className="absolute inset-y-0 left-0 w-0.5 bg-gray-800 transform scale-y-0 group-hover:scale-y-100 transition-transform duration-200 origin-center" />
      </div>
    </Link>
  );
}
