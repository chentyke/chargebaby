'use client';

import { useState, useEffect } from 'react';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { Trophy, Medal, Award, Battery, Crown, Star, GitCompare } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { BackButton } from '@/components/ui/back-button';

interface RankingInterfaceProps {
  chargeBabies: ChargeBaby[];
}

type RankingType = 'overall' | 'performance' | 'experience';

const rankingConfig = {
  overall: {
    title: '综合排行榜',
    subtitle: '综合性能与体验评分',
    key: 'overallRating' as const,
    color: 'purple',
    icon: Crown,
  },
  performance: {
    title: '性能排行榜',
    subtitle: '充电性能与输出能力',
    key: 'performanceRating' as const,
    color: 'blue',
    icon: Trophy,
  },
  experience: {
    title: '体验排行榜',
    subtitle: '便携性与使用体验',
    key: 'experienceRating' as const,
    color: 'green',
    icon: Star,
  },
};

export function RankingInterface({ chargeBabies }: RankingInterfaceProps) {
  const [activeTab, setActiveTab] = useState<RankingType>('overall');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const getRankedProducts = (type: RankingType) => {
    const config = rankingConfig[type];
    return chargeBabies
      .filter(product => product[config.key] > 0)
      .sort((a, b) => b[config.key] - a[config.key])
      .slice(0, 20); // 显示前20名
  };

  const currentRanking = getRankedProducts(activeTab);
  const currentConfig = rankingConfig[activeTab];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Award className="w-5 h-5 text-gray-500" />;
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      const colors = {
        1: 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white',
        2: 'bg-gradient-to-r from-gray-400 to-gray-600 text-white',
        3: 'bg-gradient-to-r from-amber-500 to-amber-700 text-white',
      };
      return colors[rank as keyof typeof colors] || 'bg-gray-100 text-gray-600';
    }
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
      
      {/* 返回按钮和对比按钮 */}
      <div className="container px-4 sm:px-6 lg:px-8 pt-6 pb-4 relative">
        <div className="flex justify-between items-center">
          <BackButton href="/" variant="compact">
            返回主页
          </BackButton>
          
          {/* 对比按钮 */}
          <Link href="/compare">
            <div className="flex items-center gap-2 h-10 px-4 bg-white/70 backdrop-blur-2xl rounded-2xl border border-white/30 shadow-lg shadow-black/5 text-purple-600 hover:text-purple-700 hover:bg-purple-50/30 transition-all duration-300 group">
              <GitCompare className="w-4 h-4" />
              <span className="text-sm font-medium whitespace-nowrap">对比</span>
            </div>
          </Link>
        </div>
      </div>

      {/* 主标题 */}
      <div className="text-center py-8 relative">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            移动电源评分排行榜
          </span>
        </h1>
        <p className="text-lg text-gray-600">
          基于实际测试数据进行量化评分
        </p>
      </div>

      {/* 标签切换 */}
      <div className="sticky top-0 z-50 backdrop-blur-md">
        <div className="container px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-center">
            <div className="inline-flex bg-white/15 backdrop-blur-sm rounded-2xl p-1 relative overflow-hidden">
              {/* 动态选择框背景 */}
              <div 
                className="absolute top-1 bottom-1 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg transition-all duration-500 ease-out"
                style={{
                  left: `calc(${(Object.keys(rankingConfig) as RankingType[]).indexOf(activeTab) * (100 / 3)}% + 2px)`,
                  width: `calc(${100 / 3}% - 4px)`,
                }}
              />
              
              {(Object.keys(rankingConfig) as RankingType[]).map((type) => {
                const config = rankingConfig[type];
                const Icon = config.icon;
                const isActive = activeTab === type;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`flex items-center gap-2 px-4 py-3 transition-all duration-300 rounded-xl relative z-10 ${
                      isActive
                        ? 'text-white scale-105'
                        : 'text-gray-600 hover:text-gray-800 hover:scale-102'
                    }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-300 ${
                      isActive ? 'text-white drop-shadow-sm' : ''
                    }`} />
                    <span className={`font-medium text-sm sm:text-base whitespace-nowrap transition-all duration-300 ${
                      isActive ? 'font-bold text-white drop-shadow-sm' : ''
                    }`}>
                      {isMobile ? config.title.replace('排行榜', '') : config.title}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 排行榜内容 */}
      <div className="container px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="max-w-4xl mx-auto">

          {/* 前三名特殊展示 - 仅桌面端 */}
          {!isMobile && currentRanking.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
              {/* 第二名 */}
              <div className="md:order-1 relative">
                <TopProduct 
                  product={currentRanking[1]} 
                  rank={2} 
                  config={currentConfig}
                  isMobile={isMobile}
                />
              </div>
              
              {/* 第一名 */}
              <div className="md:order-2 relative md:-mt-6">
                <TopProduct 
                  product={currentRanking[0]} 
                  rank={1} 
                  config={currentConfig}
                  isMobile={isMobile}
                  isFirst
                />
              </div>
              
              {/* 第三名 */}
              <div className="md:order-3 relative">
                <TopProduct 
                  product={currentRanking[2]} 
                  rank={3} 
                  config={currentConfig}
                  isMobile={isMobile}
                />
              </div>
            </div>
          )}

          {/* 排行榜列表 */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            {(isMobile ? currentRanking : currentRanking.slice(3)).map((product, index) => (
              <RankingItem
                key={product.id}
                product={product}
                rank={isMobile ? index + 1 : index + 4}
                config={currentConfig}
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TopProduct({ 
  product, 
  rank, 
  config, 
  isMobile, 
  isFirst = false 
}: { 
  product: ChargeBaby; 
  rank: number; 
  config: typeof rankingConfig[keyof typeof rankingConfig];
  isMobile: boolean;
  isFirst?: boolean;
}) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-8 h-8 text-yellow-500" />;
    if (rank === 2) return <Trophy className="w-7 h-7 text-gray-400" />;
    if (rank === 3) return <Medal className="w-7 h-7 text-amber-600" />;
    return null;
  };

  return (
    <Link href={`/${encodeURIComponent(product.model)}?from=ranking`}>
      <div className={`bg-white rounded-3xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isFirst ? 'ring-2 ring-yellow-200' : ''}`}>
        {/* 排名图标 */}
        <div className="flex justify-center mb-4">
          {getRankIcon(rank)}
        </div>

        {/* 产品图片 */}
        <div className="aspect-square bg-gray-50 rounded-2xl mb-4 p-4 flex items-center justify-center">
          {product.imageUrl ? (
            <NotionImage
              src={product.imageUrl}
              alt={product.title}
              width={isMobile ? 120 : 150}
              height={isMobile ? 120 : 150}
              className="object-contain w-full h-full"
            />
          ) : (
            <Battery className="w-16 h-16 text-gray-300" />
          )}
        </div>

        {/* 产品信息 */}
        <div className="text-center space-y-2">
          <h3 className={`font-bold text-gray-900 ${isMobile ? 'text-sm' : 'text-base'} line-clamp-2`}>
            {product.displayName || product.title}
          </h3>
          {product.model && (
            <p className="text-xs text-gray-500 truncate">{product.model}</p>
          )}
          <div className="inline-flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1">
            <span className="text-gray-600 text-xs">评分</span>
            <span className={`font-bold text-gray-900 ${isMobile ? 'text-lg' : 'text-xl'}`}>
              {Math.round(product[config.key])}/100
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function RankingItem({ 
  product, 
  rank, 
  config, 
  isMobile 
}: { 
  product: ChargeBaby; 
  rank: number; 
  config: typeof rankingConfig[keyof typeof rankingConfig];
  isMobile: boolean;
}) {
  return (
    <Link href={`/${encodeURIComponent(product.model)}?from=ranking`}>
      <div className="flex items-center gap-4 p-4 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0">
        {/* 排名 */}
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <span className="font-bold text-blue-600">{rank}</span>
          </div>
        </div>

        {/* 产品图片 */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-gray-50 rounded-xl p-2 flex items-center justify-center">
            {product.imageUrl ? (
              <NotionImage
                src={product.imageUrl}
                alt={product.title}
                width={48}
                height={48}
                className="object-contain w-full h-full"
              />
            ) : (
              <Battery className="w-8 h-8 text-gray-300" />
            )}
          </div>
        </div>

        {/* 产品信息 */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-gray-900 truncate ${isMobile ? 'text-sm' : 'text-base'}`}>
            {product.displayName || product.title}
          </h3>
          {product.model && (
            <p className="text-xs text-gray-500 truncate">{product.model}</p>
          )}
        </div>

        {/* 评分 */}
        <div className="flex-shrink-0 mr-2">
          <span className={`font-bold text-gray-900 ${isMobile ? 'text-xl' : 'text-2xl'}`}>
            {Math.round(product[config.key])}
          </span>
        </div>
      </div>
    </Link>
  );
}