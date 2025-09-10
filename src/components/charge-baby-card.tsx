import Image from 'next/image';
import Link from 'next/link';
import { Battery } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { cn } from '@/lib/utils';

interface ChargeBabyCardProps {
  chargeBaby: ChargeBaby;
  className?: string;
  index?: number;
}

export function ChargeBabyCard({ chargeBaby, className, index = 0 }: ChargeBabyCardProps) {
  const {
    id,
    title,
    displayName,
    imageUrl,
  } = chargeBaby;

  return (
    <Link 
      href={`/charge-baby/${id}`}
      prefetch={index < 8} // 预取前8个项目的页面
    >
      <div 
        className={cn(
          'group relative bg-white/70 backdrop-blur-2xl rounded-2xl overflow-hidden border border-white/20 hover:border-white/30 transition-all duration-500 ease-out transform hover:scale-[1.02] cursor-pointer shadow-lg shadow-black/5 hover:shadow-2xl hover:shadow-black/10',
          'before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-500',
          className
        )}
        style={{ 
          animationDelay: `${index * 80}ms`,
          opacity: 0,
          animation: `slideInUp 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${index * 80}ms forwards`
        }}
      >
        {/* 图片容器和文字叠加区域 */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50/80 via-white/50 to-gray-100/80 backdrop-blur-sm">
          {/* 背景装饰 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          {/* 网格背景纹理 */}
          <div className="absolute inset-0 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700"
               style={{
                 backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)`,
                 backgroundSize: '20px 20px'
               }}>
          </div>
          
          {/* 产品图片 */}
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain p-6 transition-all duration-500 ease-out group-hover:scale-110 group-hover:drop-shadow-lg filter"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw"
              priority={index < 6}
              loading={index < 6 ? "eager" : "lazy"}
              placeholder="blur"
              blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjMyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjlmYWZiIi8+PC9zdmc+"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Battery className="w-16 h-16 text-gray-400/60 transition-all duration-500 group-hover:text-gray-500 group-hover:scale-110 filter drop-shadow-sm" />
            </div>
          )}
          
          {/* 渐变毛玻璃遮罩层 - 使用mask实现毛玻璃强度渐变 */}
          <div className="absolute inset-x-0 bottom-0 h-2/5 backdrop-blur-2xl bg-white/40 transition-all duration-500 group-hover:backdrop-blur-3xl group-hover:bg-white/50"
               style={{
                 maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)',
                 WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0.6) 70%, rgba(0,0,0,0) 100%)'
               }}>
          </div>
          
          {/* 文字叠加区域 */}
          <div className="absolute inset-x-0 bottom-0 p-5 pb-4">
            <h3 className="font-semibold text-gray-900 text-base leading-tight truncate transition-all duration-300 group-hover:scale-[1.02] transform-gpu drop-shadow-md">
              {displayName || title}
            </h3>
          </div>
          
          {/* 光效 */}
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
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
