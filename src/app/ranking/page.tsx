import { Suspense } from 'react';
import Link from 'next/link';
import { RankingInterface } from '@/components/ranking-interface';
import { getChargeBabies } from '@/lib/notion';
import { Loading } from '@/components/ui/loading';

export const metadata = {
  title: '移动电源评分排行榜 - ChargeBaby',
  description: '基于实际测试数据进行量化评分的移动电源排行榜，包含综合、性能和体验三个排行榜',
};

export default function RankingPage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<Loading text="加载排行榜数据..." />}>
        <RankingContent />
      </Suspense>
    </div>
  );
}

async function RankingContent() {
  try {
    const chargeBabies = await getChargeBabies();
    
    return <RankingInterface chargeBabies={chargeBabies} />;
  } catch (error) {
    console.error('Error loading ranking data:', error);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="mb-8">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">加载失败</h1>
            <p className="text-gray-600">
              网络连接异常，请检查网络后重试
            </p>
          </div>
          
          <div className="space-y-3">
            <Link 
              href="/ranking"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              🔄 刷新页面
            </Link>
            <div className="mt-3">
              <Link 
                href="/"
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                返回首页
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
}