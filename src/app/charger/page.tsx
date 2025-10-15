import { Suspense } from 'react';
import Link from 'next/link';
import { Power, Zap } from 'lucide-react';
import { getChargers } from '@/lib/charger';
import { getNotices } from '@/lib/notion';
import { SearchableChargerGrid } from '@/components/searchable-charger-grid';
import { NoticeCarousel } from '@/components/notice-carousel';
import { Loading } from '@/components/ui/loading';
import { DeviceOptimizedContainer } from '@/components/device-optimized-container';
import { SiteSwitcher } from '@/components/site-switcher';

interface ChargerPageProps {
  searchParams: Promise<{
    view?: 'grid' | 'list';
  }>;
}

function NoticeSectionFallback() {
  return (
    <div className="flex justify-center">
      <Loading text="加载公告..." />
    </div>
  );
}

async function NoticeSection() {
  const notices = await getNotices();

  if (notices.length === 0) {
    return null;
  }

  return (
    <NoticeCarousel notices={notices} />
  );
}

export default function ChargerPage({ searchParams }: ChargerPageProps) {
  return (
    <DeviceOptimizedContainer className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-100/50 relative">
      {/* 统一背景装饰层 - 覆盖整个页面 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-50/30 via-transparent to-red-50/20 pointer-events-none"></div>

      {/* 网格背景 - 覆盖整个页面，降低透明度 */}
      <div className="absolute inset-0 opacity-[0.008]"
           style={{
             backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>

      {/* 主要内容容器 */}
      <div className="relative">
        {/* 页面标题和搜索区域 */}
        <header className="pt-10 sm:pt-12 pb-8 relative">
          {/* 左上角切换按钮 */}
          <SiteSwitcher currentSite="charger" />

          <div className="container sm:pt-8">

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Power className="w-8 h-8 text-orange-600" />
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-orange-600 via-orange-700 to-red-600 bg-clip-text text-transparent">
                    充电器数据库
                  </span>
                </h1>
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-lg text-gray-600/90">
                专业测试数据与性能对比
              </p>
            </div>

            {/* 公告轮播区域 - 紧贴标题 */}
            <div className="mb-4">
              <Suspense fallback={<NoticeSectionFallback />}>
                <NoticeSection />
              </Suspense>
            </div>

            {/* 集成搜索区域 */}
            <Suspense fallback={<Loading text="加载中..." />}>
              <ChargerGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </header>
      </div>
    </DeviceOptimizedContainer>
  );
}

async function ChargerGrid({ searchParams }: { searchParams: Promise<{ view?: 'grid' | 'list' }> }) {
  try {
    const chargers = await getChargers();
    const { view } = await searchParams;

    return <SearchableChargerGrid chargers={chargers} initialViewMode={view} />;
  } catch (error) {
    console.error('Error loading chargers:', error);

    return (
      <div className="text-center py-20 text-gray-600 animate-fade-in">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-lg font-medium text-gray-900">数据加载失败</div>
          <div className="text-sm text-gray-600">网络连接异常，请刷新页面重试</div>
          <div className="mt-6">
            <Link
              href="/charger"
              className="inline-flex items-center gap-2 bg-orange-600 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition-colors text-sm"
            >
              🔄 刷新页面
            </Link>
          </div>
        </div>
      </div>
    );
  }
}