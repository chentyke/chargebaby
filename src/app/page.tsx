import { Suspense } from 'react';
import { getChargeBabies } from '@/lib/notion';
import { ChargeBabyCard } from '@/components/charge-baby-card';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* 页面标题 */}
      <header className="pt-8 pb-4">
        <div className="container">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-center text-gray-900 mb-2">
            充电宝图鉴
          </h1>
          <p className="text-center text-gray-600 text-sm sm:text-base">
            专业充电宝性能测试与评测
          </p>
        </div>
      </header>

      <section className="py-6">
        <div className="container">
          <Suspense fallback={<Loading text="加载中..." />}>
            <ProductsGrid />
          </Suspense>
        </div>
      </section>
    </div>
  );
}

async function ProductsGrid() {
  try {
    const chargeBabies = await getChargeBabies();
    
    if (chargeBabies.length === 0) {
      return (
        <div className="text-center py-12 text-gray-600">暂无产品数据</div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 lg:gap-8">
        {chargeBabies.map((chargeBaby, index) => (
          <ChargeBabyCard 
            key={chargeBaby.id} 
            chargeBaby={chargeBaby}
            index={index}
          />
        ))}
      </div>
    );
  } catch (error) {
    console.error('Error loading products:', error);
    
    return (
      <div className="text-center py-12 text-gray-600">加载失败</div>
    );
  }
}
