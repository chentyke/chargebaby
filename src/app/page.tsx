import { Suspense } from 'react';
import Link from 'next/link';
import { Cable } from 'lucide-react';
import { getChargeBabies } from '@/lib/notion';
import { SearchableProductsGrid } from '@/components/searchable-products-grid';
import { Loading } from '@/components/ui/loading';
import { DeviceOptimizedContainer } from '@/components/device-optimized-container';

interface HomePageProps {
  searchParams: Promise<{
    view?: 'grid' | 'list';
  }>;
}

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <DeviceOptimizedContainer className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 统一背景装饰层 - 覆盖整个页面 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      
      {/* 网格背景 - 覆盖整个页面，降低透明度 */}
      <div className="absolute inset-0 opacity-[0.008]" 
           style={{
             backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>
      
      {/* 主要内容容器 - 无分割线 */}
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
                href="/cable"
                aria-label="切换到数据线版"
                className="relative inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 pr-10 sm:pr-12 rounded-lg sm:rounded-xl border border-white/60 bg-gradient-to-br from-white/95 via-white/80 to-white/60 backdrop-blur-md shadow-sm text-sm font-medium text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 after:content-['BETA'] after:absolute after:-top-2 after:-right-2 after:inline-flex after:items-center after:justify-center after:px-2 after:h-5 after:sm:h-6 after:text-[9px] after:sm:text-[10px] after:font-bold after:bg-gradient-to-br after:from-red-500 after:to-red-600 after:text-white after:rounded-full after:shadow after:border after:border-white/70 after:pointer-events-none after:z-10"
              >
                <Cable className="w-4 h-4 text-blue-500" />
                <span className="text-sm">切换到数据线版</span>
              </Link>
            </div>
          </div>

          <div className="container">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  移动电源数据库
                </span>
              </h1>
              <p className="text-lg text-gray-600/90">
                测试数据收集与量化评分
              </p>
            </div>
            
            {/* 集成搜索区域 */}
            <Suspense fallback={<Loading text="加载中..." />}>
              <ProductsGrid searchParams={searchParams} />
            </Suspense>
          </div>
        </header>
      </div>
    </DeviceOptimizedContainer>
  );
}

async function ProductsGrid({ searchParams }: { searchParams: Promise<{ view?: 'grid' | 'list' }> }) {
  try {
    const chargeBabies = await getChargeBabies();
    const { view } = await searchParams;
    
    return <SearchableProductsGrid chargeBabies={chargeBabies} initialViewMode={view} />;
  } catch (error) {
    console.error('Error loading products:', error);
    
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
              href="/"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              🔄 刷新页面
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
