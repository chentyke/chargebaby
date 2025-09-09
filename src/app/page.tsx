import { Suspense } from 'react';
import { getChargeBabies } from '@/lib/notion';
import { ChargeBabyCard } from '@/components/charge-baby-card';
import { Loading } from '@/components/ui/loading';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {chargeBabies.map((chargeBaby) => (
          <ChargeBabyCard key={chargeBaby.id} chargeBaby={chargeBaby} />
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
