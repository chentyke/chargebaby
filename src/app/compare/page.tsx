import { Suspense } from 'react';
import { CompareInterface } from '@/components/compare-interface';
import { getChargeBabies } from '@/lib/notion';
import { Loading } from '@/components/ui/loading';

export const metadata = {
  title: '充电宝对比 - ChargeBaby',
  description: '专业充电宝性能对比，支持多产品参数和评分对比分析',
};

export default function ComparePage() {
  return (
    <div className="min-h-screen">
      <Suspense fallback={<Loading text="加载对比数据..." />}>
        <CompareContent />
      </Suspense>
    </div>
  );
}

async function CompareContent() {
  try {
    const chargeBabies = await getChargeBabies();
    
    return <CompareInterface chargeBabies={chargeBabies} />;
  } catch (error) {
    console.error('Error loading compare data:', error);
    
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