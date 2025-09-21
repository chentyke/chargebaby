import Link from 'next/link';
import { Battery } from 'lucide-react';
import { ChargeBaby, SortOption } from '@/types/chargebaby';
import { cn } from '@/lib/utils';
import { NotionImage } from './notion-image';

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

  return (
    <Link 
      href={`/${encodeURIComponent(model)}`}
      prefetch={index < 8} // 预取前8个项目的页面
    >
      <div 
        className={cn(
          'group relative bg-white/70 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 transition-all duration-200 ease-out transform cursor-pointer shadow-lg shadow-black/5',
          'hover-hover:hover:border-white/30 hover-hover:hover:scale-[1.02] hover-hover:hover:shadow-2xl hover-hover:hover:shadow-black/10',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover-hover:hover:before:opacity-100 before:transition-opacity before:duration-200',
          'active:scale-[0.98] active:transition-transform active:duration-100 active:shadow-xl active:border-white/40',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-transparent',
          'touch-manipulation select-none',
          className
        )}
        style={{ 
          animationDelay: `${index * 80}ms`,
          opacity: 0,
          animation: `slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 80}ms forwards`
        }}
      >
        {/* 图片容器 */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-sm">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-200"></div>
          
          {/* 网格背景纹理 */}
          <div className="absolute inset-0 opacity-[0.02] hover-hover:group-hover:opacity-[0.05] transition-opacity duration-200"
               style={{
                 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
                 backgroundSize: '20px 20px'
               }}>
          </div>
          
          {/* 高级标签设计 - 左上角 */}
          {hasActiveFilters && sortValue && (
            <div className="absolute top-1 left-2 z-10">
              <div className="relative">
                {/* 背景渐变层 */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/8 to-indigo-500/10 rounded-full blur-sm"></div>
                {/* 主体 */}
                <div className="relative bg-gradient-to-r from-white/95 via-white/90 to-white/95 backdrop-blur-lg rounded-full px-2 py-1 sm:px-3 sm:py-1.5 border border-white/30 shadow-lg shadow-black/5 transition-all duration-300 hover-hover:group-hover:shadow-xl hover-hover:group-hover:shadow-blue-500/10 hover-hover:group-hover:border-blue-200/40">
                  <span className="text-[10px] sm:text-xs font-semibold bg-gradient-to-r from-gray-700 via-gray-800 to-gray-700 bg-clip-text text-transparent">
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
              className="object-contain px-2 pb-2 -mt-4 transition-all duration-200 ease-out hover-hover:group-hover:scale-110 hover-hover:group-hover:drop-shadow-lg filter"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 6}
              loading={index < 6 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmYWZiIi8+PC9zdmc+"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Battery className="w-16 h-16 text-gray-400/60 transition-all duration-200 hover-hover:group-hover:text-gray-500 hover-hover:group-hover:scale-110 filter drop-shadow-sm" />
            </div>
          )}
          
          {/* 渐变毛玻璃遮罩层 - 使用mask实现毛玻璃强度渐变 */}
          <div className="absolute inset-x-0 bottom-0 h-2/3 backdrop-blur-2xl bg-white/40 transition-all duration-200 hover-hover:group-hover:backdrop-blur-3xl hover-hover:group-hover:bg-white/50"
               style={{
                 maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)',
                 WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 25%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0) 100%)'
               }}>
          </div>
          
          {/* 文字叠加区域 */}
          <div className="absolute inset-x-0 bottom-0 p-4 pb-5 flex items-end">
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-snug line-clamp-2 transition-all duration-200 hover-hover:group-hover:scale-[1.02] transform-gpu drop-shadow-md">
              {displayName || title}
            </h3>
          </div>
          
          {/* 光效 */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 hover-hover:group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
        </div>
      </div>
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
