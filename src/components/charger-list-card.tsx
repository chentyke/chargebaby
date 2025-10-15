'use client';

import Link from 'next/link';
import { Zap, Power, Star, ArrowRight } from 'lucide-react';
import { Charger } from '@/types/charger';
import { NotionImage } from '@/components/notion-image';
import { formatPrice, formatRating } from '@/lib/utils';

interface ChargerListCardProps {
  charger: Charger;
}

export function ChargerListCard({ charger }: ChargerListCardProps) {
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
      <div className="group bg-white rounded-xl border border-gray-200/50 hover:border-orange-300/50 hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
        <div className="p-4 flex gap-4">
          {/* 产品图片 */}
          <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-gray-50 to-gray-100">
            {imageUrl ? (
              <NotionImage
                src={imageUrl}
                alt={title}
                fill
                className="object-contain transition-transform duration-300 group-hover:scale-105"
                sizes="80px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Power className="w-8 h-8 text-gray-300" />
              </div>
            )}
          </div>

          {/* 产品信息 */}
          <div className="flex-1 min-w-0">
            {/* 品牌和标题 */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-xs text-gray-500 font-medium">
                  {brand && <span>{brand}</span>}
                </div>
                {overallRating && overallRating > 0 && (
                  <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-2 py-0.5">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span className="text-xs font-semibold text-gray-900">
                      {Math.round(overallRating)}
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                {title}
              </h3>
              {subtitle && (
                <p className="text-sm text-gray-600 line-clamp-1">{subtitle}</p>
              )}
            </div>

            {/* 核心规格 */}
            <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
              {detailData?.singlePortPower && (
                <div className="flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" />
                  <span>{detailData.singlePortPower}W</span>
                </div>
              )}
              {detailData?.multiPortPower && detailData.multiPortPower !== detailData.singlePortPower && (
                <div className="flex items-center gap-1">
                  <Power className="w-3.5 h-3.5" />
                  <span>总{detailData.multiPortPower}W</span>
                </div>
              )}
              {detailData?.weight && (
                <span>{detailData.weight}g</span>
              )}
              {detailData?.ports && detailData.ports.length > 0 && (
                <span>{detailData.ports[0]}</span>
              )}
            </div>

            {/* 协议标签 */}
            {protocols && protocols.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {protocols.slice(0, 4).map((protocol) => (
                  <span
                    key={protocol}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                  >
                    {protocol}
                  </span>
                ))}
                {protocols.length > 4 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    +{protocols.length - 4}
                  </span>
                )}
              </div>
            )}

            {/* 其他标签 */}
            {tags && tags.length > 0 && protocols.length === 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1">
                {tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-50 text-orange-700 border border-orange-200"
                  >
                    {tag}
                  </span>
                ))}
                {tags.length > 3 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                    +{tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 价格和操作 */}
          <div className="flex flex-col items-end justify-between">
            <div className="text-lg font-bold text-gray-900">
              {formatPrice(price)}
            </div>
            <div className="flex items-center gap-1 text-xs text-orange-600 font-medium group-hover:gap-2 transition-all">
              <span>查看详情</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}