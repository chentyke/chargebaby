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
    <Link href={`/charge-baby/${id}`}>
      <div 
        className={cn(
          'group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 transition-all duration-300 ease-out transform hover:scale-[1.02] hover:shadow-xl cursor-pointer',
          className
        )}
        style={{ 
          animationDelay: `${index * 100}ms`,
          opacity: 0,
          animation: `fadeIn 0.6s ease-out ${index * 100}ms forwards`
        }}
      >
        {/* 图片容器 */}
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw"
              priority={index < 8}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Battery className="w-16 h-16 text-gray-300 transition-colors duration-300 group-hover:text-gray-400" />
            </div>
          )}
          
          {/* 悬停时显示的渐变遮罩 */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300" />
        </div>
        
        {/* 标题区域 */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-gray-800 transition-colors duration-300">
            {displayName || title}
          </h3>
          
          {/* 底部装饰线 */}
          <div className="mt-3 h-0.5 bg-gradient-to-r from-gray-200 to-transparent group-hover:from-gray-400 transition-colors duration-300" />
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
