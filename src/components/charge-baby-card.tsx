import Image from 'next/image';
import Link from 'next/link';
import { Battery } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { cn } from '@/lib/utils';

interface ChargeBabyCardProps {
  chargeBaby: ChargeBaby;
  className?: string;
}

export function ChargeBabyCard({ chargeBaby, className }: ChargeBabyCardProps) {
  const {
    id,
    title,
    imageUrl,
  } = chargeBaby;

  return (
    <Link href={`/charge-baby/${id}`}>
      <div className={cn(
        'bg-white rounded-lg p-2 hover:shadow-md transition-shadow cursor-pointer',
        className
      )}>
        {/* 图片 */}
        <div className="relative aspect-square mb-2 overflow-hidden rounded bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Battery className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
        {/* 标题 */}
        <h3 className="font-medium text-gray-900 text-sm truncate">
          {title}
        </h3>
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
