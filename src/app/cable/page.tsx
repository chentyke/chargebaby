import { Suspense } from 'react';
import Link from 'next/link';
import { getCables } from '@/lib/cable';
import { getNotices } from '@/lib/notion';
import { SearchableCableGrid } from '@/components/searchable-cable-grid';
import { NoticeCarousel } from '@/components/notice-carousel';
import { Loading } from '@/components/ui/loading';
import { DeviceOptimizedContainer } from '@/components/device-optimized-container';
import { BatteryCharging, Cable, Zap } from 'lucide-react';

interface CablePageProps {
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

export default function CablePage({ searchParams }: CablePageProps) {
  return (
    <DeviceOptimizedContainer className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-100/50 relative">
      {/* 统一背景装饰层 - 覆盖整个页面 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-green-50/30 via-transparent to-blue-50/20 pointer-events-none"></div>

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
          <div
            className="px-4 sm:px-0 sm:absolute sm:top-0 sm:left-0"
            style={{
              paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
              paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)'
            }}
          >
            <div className="flex justify-start mb-6 sm:mb-0 sm:ml-4 sm:mt-4">
              <Link
                href="/"
                aria-label="切换到充电宝版"
                className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl border border-white/60 bg-gradient-to-br from-white/95 via-white/80 to-white/60 backdrop-blur-md shadow-sm text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                <BatteryCharging className="w-4 h-4 text-amber-500" />
                <span className="text-sm">切换到充电宝版</span>
              </Link>
            </div>
          </div>

          <div className="container sm:pt-8">

            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Cable className="w-8 h-8 text-green-600" />
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                  <span className="bg-gradient-to-r from-green-600 via-green-700 to-blue-600 bg-clip-text text-transparent">
                    充电线数据库
                  </span>
                </h1>
                <Zap className="w-8 h-8 text-blue-600" />
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
              <CableGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </header>
      </div>
    </DeviceOptimizedContainer>
  );
}

async function CableGrid({ searchParams }: { searchParams: Promise<{ view?: 'grid' | 'list' }> }) {
  try {
    const cables = await getCables();
    const { view } = await searchParams;

    return <SearchableCableGrid cables={cables} initialViewMode={view} />;
  } catch (error) {
    console.error('Error loading cables:', error);

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
              href="/cable"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              🔄 刷新页面
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
