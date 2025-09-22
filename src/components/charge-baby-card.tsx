import Link from 'next/link';
import { Battery } from 'lucide-react';
import { ChargeBaby, SortOption } from '@/types/chargebaby';
import { cn } from '@/lib/utils';
import { NotionImage } from './notion-image';
import { usePerformanceOptimization, useOptimizedClassName, useOptimizedStyle } from '@/hooks/usePerformanceOptimization';

interface ChargeBabyCardProps {
  chargeBaby: ChargeBaby;
  className?: string;
  index?: number;
  sortBy?: SortOption;
  hasActiveFilters?: boolean;
}

export function ChargeBabyCard({ chargeBaby, className, index = 0, sortBy, hasActiveFilters = false }: ChargeBabyCardProps) {
  const {
    id,
    brand,
    model,
    title,
    displayName,
    imageUrl,
    updatedAt,
    detailData,
  } = chargeBaby;

  // 性能优化配置
  const perfConfig = usePerformanceOptimization();

  // 格式化数字，保留最多两位小数
  const formatNumber = (num: number): number => {
    if (num === 0 || !num) return 0;
    return Math.round(num * 100) / 100;
  };


  // 根据排序方式获取显示值
  const getSortValue = () => {
    if (!sortBy || sortBy === 'alphabetical') return null;
    
    switch (sortBy) {
      case 'updatedAt':
        return new Date(updatedAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      case 'capacity':
        const capacity = detailData?.capacityLevel;
        return capacity ? `${Math.round(capacity / 1000)}K` : null;
      case 'power':
        const maxOutput = detailData?.maxOutputPower || 0;
        const maxSelfCharging = detailData?.maxSelfChargingPower || 0;
        const maxPower = Math.max(maxOutput, maxSelfCharging);
        return maxPower > 0 ? `${formatNumber(maxPower)}W` : null;
      case 'weight':
        const weight = detailData?.weight;
        return weight && weight > 0 ? `${formatNumber(weight)}g` : null;
      case 'price':
        return chargeBaby.price > 0 ? `¥${formatNumber(chargeBaby.price)}` : null;
      case 'overallRating':
        return chargeBaby.overallRating != null ? `${formatNumber(chargeBaby.overallRating)}分` : null;
      case 'performanceRating':
        return chargeBaby.performanceRating != null ? `${formatNumber(chargeBaby.performanceRating)}分` : null;
      case 'experienceRating':
        return chargeBaby.experienceRating != null ? `${formatNumber(chargeBaby.experienceRating)}分` : null;
      default:
        return null;
    }
  };

  const sortValue = getSortValue();
  const isWeChatGroup = model === 'WeChat';

  // 构建优化后的卡片类名
  const getCardClassName = () => {
    const baseClasses = [
      'group relative rounded-2xl overflow-hidden border cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
      'touch-manipulation select-none'
    ];

    if (perfConfig.enableBackdropBlur) {
      baseClasses.push('bg-white/70 backdrop-blur-2xl border-white/20 shadow-lg shadow-black/5');
    } else {
      baseClasses.push('bg-white border-gray-200 shadow-sm');
    }

    if (perfConfig.enableTransitions) {
      baseClasses.push('transition-all duration-200 ease-out transform');
    }

    if (perfConfig.enableHoverEffects) {
      if (perfConfig.enableBackdropBlur) {
        baseClasses.push(
          'hover-hover:hover:border-white/30 hover-hover:hover:scale-[1.02] hover-hover:hover:shadow-2xl hover-hover:hover:shadow-black/10',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover-hover:hover:before:opacity-100 before:transition-opacity before:duration-200'
        );
      } else {
        baseClasses.push('hover-hover:hover:border-gray-300 hover-hover:hover:shadow-md');
      }
    }

    if (perfConfig.enableAnimations) {
      baseClasses.push('active:scale-[0.98] active:transition-transform active:duration-100');
      if (perfConfig.enableShadows) {
        baseClasses.push('active:shadow-xl active:border-white/40');
      }
    }

    return cn(baseClasses, className);
  };

  // 优化后的内联样式
  const getCardStyle = () => {
    const baseStyle: React.CSSProperties = {};
    
    if (perfConfig.enableAnimations) {
      baseStyle.animationDelay = `${index * 80}ms`;
      baseStyle.opacity = 0;
      baseStyle.animation = `slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 80}ms forwards`;
      
      if (perfConfig.enableWillChange) {
        baseStyle.willChange = 'transform';
      }
    } else {
      baseStyle.opacity = 1;
    }

    return baseStyle;
  };

  const cardContent = (
    <div 
      className={getCardClassName()}
      style={getCardStyle()}
    >
        {/* 图片容器 */}
        <div className={cn(
          "relative aspect-[4/5] overflow-hidden",
          perfConfig.enableGradients 
            ? "bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80" 
            : "bg-gray-50",
          perfConfig.enableBackdropBlur ? "backdrop-blur-sm" : ""
        )}>
          {/* 背景装饰 - 仅在支持的设备上显示 */}
          {perfConfig.enableHoverEffects && perfConfig.enableGradients && (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-200"></div>
          )}
          
          {/* 网格背景纹理 - 仅在高性能设备上显示 */}
          {perfConfig.performanceLevel === 'high' && (
            <div className="absolute inset-0 opacity-[0.02] hover-hover:group-hover:opacity-[0.05] transition-opacity duration-200"
                 style={{
                   backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
                   backgroundSize: '20px 20px'
                 }}>
            </div>
          )}
          
          {/* 高级标签设计 - 左上角 */}
          {hasActiveFilters && sortValue && (
            <div className="absolute top-1 left-2 z-10">
              <div className="relative">
                {/* 背景渐变层 - 仅在高性能设备显示 */}
                {perfConfig.performanceLevel === 'high' && perfConfig.enableGradients && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/8 to-indigo-500/10 rounded-full blur-sm"></div>
                )}
                {/* 主体 */}
                <div className={cn(
                  "relative rounded-full px-2 py-1 sm:px-3 sm:py-1.5 border",
                  perfConfig.enableGradients && perfConfig.enableBackdropBlur
                    ? "bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-lg border-white/30"
                    : "bg-white border-gray-200",
                  perfConfig.enableShadows 
                    ? "shadow-lg shadow-black/5" 
                    : "shadow-sm",
                  perfConfig.enableTransitions && perfConfig.enableHoverEffects
                    ? "transition-all duration-300 hover-hover:group-hover:shadow-xl hover-hover:group-hover:shadow-blue-500/10 hover-hover:group-hover:border-blue-200/40"
                    : ""
                )}>
                  <span className={cn(
                    "text-[10px] sm:text-xs font-semibold",
                    perfConfig.enableGradients
                      ? "bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 bg-clip-text text-transparent"
                      : "text-gray-700"
                  )}>
                    {sortValue || model}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* 产品图片 */}
          {imageUrl ? (
            <NotionImage
              src={imageUrl}
              alt={title}
              fill
              className={cn(
                "object-contain px-2 pb-2 -mt-4 filter",
                perfConfig.enableTransitions ? "transition-all duration-200 ease-out" : "",
                perfConfig.enableHoverEffects 
                  ? "hover-hover:group-hover:scale-110"
                  : "",
                perfConfig.enableShadows && perfConfig.enableHoverEffects
                  ? "hover-hover:group-hover:drop-shadow-lg"
                  : ""
              )}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 6}
              loading={index < 6 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmYWZiIi8+PC9zdmc+"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Battery className={cn(
                "w-16 h-16 text-gray-400/60 filter",
                perfConfig.enableTransitions ? "transition-all duration-200" : "",
                perfConfig.enableHoverEffects 
                  ? "hover-hover:group-hover:text-gray-500 hover-hover:group-hover:scale-110"
                  : "",
                perfConfig.enableShadows ? "drop-shadow-sm" : ""
              )} />
            </div>
          )}
          
          {/* 渐变毛玻璃遮罩层 - 使用mask实现毛玻璃强度渐变 */}
          <div 
            className={cn(
              "absolute inset-x-0 bottom-0 h-2/3",
              perfConfig.enableBackdropBlur ? "backdrop-blur-2xl bg-white/40" : "bg-white/60",
              perfConfig.enableTransitions ? "transition-all duration-200" : "",
              perfConfig.enableHoverEffects && perfConfig.enableBackdropBlur
                ? "hover-hover:group-hover:backdrop-blur-3xl hover-hover:group-hover:bg-white/50"
                : perfConfig.enableHoverEffects
                ? "hover-hover:group-hover:bg-white/70"
                : ""
            )}
            style={{
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'
            }}>
          </div>
          
          {/* 文字叠加区域 */}
          <div className="absolute inset-x-0 bottom-0 p-4 pb-5 flex items-end">
            <h3 className={cn(
              "font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2",
              perfConfig.enableTransitions ? "transition-all duration-200" : "",
              perfConfig.enableHoverEffects && perfConfig.enableTransform3d 
                ? "hover-hover:group-hover:scale-[1.02] transform-gpu"
                : "",
              perfConfig.enableShadows ? "drop-shadow-md" : ""
            )}>
              {displayName || title}
            </h3>
          </div>
          
          {/* 光效 - 仅在高性能设备显示 */}
          {perfConfig.performanceLevel === 'high' && perfConfig.enableGradients && (
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
          )}
        </div>
    </div>
  );

  // 如果是WeChat群组，跳转到专门的wechat页面
  if (isWeChatGroup) {
    return (
      <Link href="/wechat">
        {cardContent}
      </Link>
    );
  }

  // 普通充电宝卡片，使用Link包裹
  return (
    <Link 
      href={`/${encodeURIComponent(model)}`}
      prefetch={index < 8} // 预取前8个项目的页面
    >
      {cardContent}
    </Link>
  );
}

export function ChargeBabyCardSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="aspect-square mb-4 bg-gray-200 rounded-lg"></div>
      <div className="space-y-3">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="flex space-x-1">
          <div className="h-5 bg-gray-200 rounded w-12"></div>
          <div className="h-5 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="h-6 bg-gray-200 rounded w-16"></div>
          <div className="h-4 bg-gray-200 rounded w-12"></div>
        </div>
      </div>
    </div>
  );
}
