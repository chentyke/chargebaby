import { Suspense } from 'react';
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
      <div className="text-center py-12 text-gray-600 animate-fade-in">
        <div className="space-y-3">
          <div className="text-lg font-medium">加载失败</div>
          <div className="text-sm">请刷新页面重试</div>
        </div>
      </div>
    );
  }
}
