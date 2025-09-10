import { Suspense } from 'react';
import { RankingInterface } from '@/components/ranking-interface';
import { getChargeBabies } from '@/lib/notion';
import { Loading } from '@/components/ui/loading';

export const metadata = {
  title: '充电宝排行榜 - ChargeBaby',
  description: '专业充电宝排行榜，包含综合、性能和体验三个排行榜',
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
      <div className="text-center py-12 text-gray-600 animate-fade-in">
        <div className="space-y-3">
          <div className="text-lg font-medium">加载失败</div>
          <div className="text-sm">请刷新页面重试</div>
        </div>
      </div>
    );
  }
}