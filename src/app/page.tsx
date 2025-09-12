import { Suspense } from 'react';
import Link from 'next/link';
import { getChargeBabies } from '@/lib/notion';
import { SearchableProductsGrid } from '@/components/searchable-products-grid';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 统一背景装饰层 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/30 via-transparent to-purple-50/30 pointer-events-none"></div>
      
      {/* 网格背景 */}
      <div className="absolute inset-0 opacity-[0.015]" 
           style={{
             backgroundImage: `linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)`,
             backgroundSize: '50px 50px'
           }}>
      </div>
      
      {/* 主要内容容器 - 无分割线 */}
      <div className="relative">
        {/* 页面标题和搜索区域 */}
        <header className="pt-12 pb-8">
          <div className="container">
            <div className="text-center mb-8">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-3 leading-tight">
                <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  充电宝图鉴
                </span>
              </h1>
              <p className="text-lg text-gray-600/90">
                专业充电宝性能测试与评测
              </p>
            </div>
            
            {/* 集成搜索区域 */}
            <Suspense fallback={<Loading text="加载中..." />}>
              <ProductsGrid />
            </Suspense>
          </div>
        </header>
      </div>
    </div>
  );
}

async function ProductsGrid() {
  try {
    const chargeBabies = await getChargeBabies();
    
    return <SearchableProductsGrid chargeBabies={chargeBabies} />;
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
