'use client';

import Link from 'next/link';
import { Zap, Power, Star } from 'lucide-react';
import { Charger } from '@/types/charger';
import { NotionImage } from '@/components/notion-image';
import { formatPrice, formatRating } from '@/lib/utils';

interface ChargerCardProps {
  charger: Charger;
}

export function ChargerCard({ charger }: ChargerCardProps) {
  const {
    id,
    title,
    subtitle,
    brand,
    model,
    tags,
    protocols,
    price,
    overallRating,
    detailData,
    imageUrl
  } = charger;

  return (
    <Link href={`/charger/${encodeURIComponent(model)}`}>
      <div className="group relative bg-white rounded-2xl border border-gray-200/50 hover:border-orange-300/50 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full flex flex-col">
        {/* 产品图片 */}
        <div className="aspect-[4/3] overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 relative flex-shrink-0">
          {imageUrl ? (
            <NotionImage
              src={imageUrl}
              alt={title}
              fill
              className="object-contain transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Power className="w-12 h-12 text-gray-300" />
            </div>
          )}

          {/* 功率标签 */}
          {detailData?.singlePortPower && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md">
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-orange-500" />
                <span className="text-xs font-semibold text-gray-900">
                  {detailData.singlePortPower}W
                </span>
              </div>
            </div>
          )}

          {/* 多口功率标签 */}
          {detailData?.multiPortPower && detailData.multiPortPower !== detailData.singlePortPower && (
            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 shadow-md">
              <div className="flex items-center gap-1">
                <Power className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs font-semibold text-gray-900">
                  总{detailData.multiPortPower}W
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 产品信息 */}
        <div className="p-5 flex flex-col flex-1">
          {/* 标题和品牌 */}
          <div className="space-y-2 flex-1">
            <div className="text-xs text-gray-500 font-medium">
              {brand && <span>{brand}</span>}
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight line-clamp-2 group-hover:text-orange-600 transition-colors">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm text-gray-600 line-clamp-1">{subtitle}</p>
            )}
          </div>

          {/* 核心规格 */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            {detailData?.singlePortPower && (
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span>{detailData.singlePortPower}W</span>
              </div>
            )}
            {detailData?.weight && (
              <div className="flex items-center gap-1">
                <span>重{detailData.weight}g</span>
              </div>
            )}
            {detailData?.ports && detailData.ports.length > 0 && (
              <div className="flex items-center gap-1">
                <span>{detailData.ports[0]}</span>
              </div>
            )}
          </div>

          {/* 协议标签 */}
          {protocols && protocols.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {protocols.slice(0, 3).map((protocol) => (
                <span
                  key={protocol}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {protocol}
                </span>
              ))}
              {protocols.length > 3 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  +{protocols.length - 3}
                </span>
              )}
            </div>
          )}

          {/* 其他标签 */}
          {tags && tags.length > 0 && protocols.length === 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                  +{tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* 价格 */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(price)}
              </div>
              <div className="text-xs text-orange-600 font-medium">
                查看详情 →
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}