import { Suspense } from 'react';
import { BackButton } from '@/components/ui/back-button';
import { Loading } from '@/components/ui/loading';
import { WishlistInterface } from '@/components/wishlist-interface';
import { getWishlistProducts } from '@/lib/notion';

export const metadata = {
  title: '待测排行榜 - ChargeBaby',
  description: '查看用户最想测试的充电宝产品排行榜，为您的购买决策提供参考',
};

export default function WishlistPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-50/20 via-transparent to-blue-50/20 pointer-events-none"></div>
      
      <div className="container py-6 sm:py-10 relative">
        {/* 返回按钮 */}
        <div className="mb-6">
          <BackButton href="/submit" variant="compact">
            返回投稿页面
          </BackButton>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            <span className="bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 bg-clip-text text-transparent">
              待测排行榜
            </span>
          </h1>
          <p className="text-lg text-gray-600/90 max-w-2xl mx-auto">
            看看大家最想测试哪些充电宝产品，投票支持您感兴趣的产品
          </p>
        </div>

        {/* 待测产品列表 */}
        <Suspense fallback={<Loading text="加载待测产品..." />}>
          <WishlistContent />
        </Suspense>
      </div>
    </div>
  );
}

async function WishlistContent() {
  try {
    const wishlistProducts = await getWishlistProducts();
    
    return <WishlistInterface wishlistProducts={wishlistProducts} />;
  } catch (error) {
    console.error('Error loading wishlist products:', error);
    
    return (
      <div className="text-center py-20 text-gray-600">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">⚠️</span>
          </div>
          <div className="text-lg font-medium text-gray-900">数据加载失败</div>
          <div className="text-sm text-gray-600">网络连接异常，请刷新页面重试</div>
        </div>
      </div>
    );
  }
}