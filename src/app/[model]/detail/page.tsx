import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getChargeBabyByModel } from '@/lib/notion';
import { DetailData } from '@/types/chargebaby';
import { PageHeader } from '@/components/ui/back-button';
import { TitleWithTooltip } from '@/components/ui/title-with-tooltip';

interface PageProps {
  params: Promise<{
    model: string;
  }>;
}

export default async function DetailDataPage({ params }: PageProps) {
  const { model } = await params;
  const chargeBaby = await getChargeBabyByModel(decodeURIComponent(model));

  if (!chargeBaby || !chargeBaby.detailData) {
    notFound();
  }

  const { title, detailData } = chargeBaby;

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-6 sm:py-10">
        <PageHeader 
          backButton={{ href: `/${encodeURIComponent(model)}`, text: "返回详情" }}
          title={`${title} - 详细测试数据`}
          subtitle={`以下数据来自「${detailData.dataSource}」的测试，仅供参考`}
        />

        {/* 数据展示 */}
        <div className="space-y-8">
          {/* 物理规格 */}
          <DataSection title="物理规格" data={detailData}>
            <DataItem label="尺寸" value={`${detailData.length} × ${detailData.width} × ${detailData.thickness} cm`} />
            <DataItem label="重量" value={`${detailData.weight}g`} />
            <DataItem label="体积" value={`${detailData.volume}cm³`} />
            <DataItem label="能量重量比" value={`${detailData.energyWeightRatio || detailData.capacityWeightRatio} Wh/g`} />
            <DataItem label="能量体积比" value={`${detailData.energyVolumeRatio || detailData.capacityVolumeRatio} Wh/cm³`} />
          </DataSection>

          {/* 电池容量 */}
          <DataSection title="电池容量" data={detailData}>
            <DataItem label="容量级别" value={`${detailData.capacityLevel}mAh`} />
            <DataItem label="最大放电能量" value={`${detailData.maxDischargeCapacity}Wh`} />
            <DataItem label="自充能量" value={`${detailData.selfChargingEnergy}Wh`} />
            <DataItem label="放电能量达成率" value={`${(detailData.dischargeCapacityAchievementRate * 100).toFixed(1)}%`} />
            <DataItem label="最大能量转换率" value={`${(detailData.maxEnergyConversionRate * 100).toFixed(1)}%`} />
          </DataSection>

          {/* 自充电性能 */}
          <DataSection title="自充电性能" data={detailData}>
            <DataItem label="最大自充电功率" value={`${detailData.maxSelfChargingPower}W`} />
            <DataItem label="自充电时间" value={`${detailData.selfChargingTime}分钟`} />
            <DataItem label="平均自充电功率" value={`${detailData.avgSelfChargingPower}W`} />
            <DataItem label="20分钟充入能量" value={`${detailData.energy20min}Wh`} />
          </DataSection>

          {/* 输出性能 */}
          <DataSection title="输出性能" data={detailData}>
            <DataItem label="最大输出功率" value={`${detailData.maxOutputPower}W`} />
            <DataItem label="最大持续输出功率" value={`${detailData.maxContinuousOutputPower}W`} />
          </DataSection>


          {/* 数据来源 */}
          {detailData.dataSource && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">数据来源</h3>
              <p className="text-sm text-gray-600">{detailData.dataSource}</p>
            </div>
          )}
        </div>

        {/* 免责声明 */}
        <div className="mt-10 text-xs leading-5 text-gray-400 border-t border-gray-200 pt-6">
          产品评分与内容基于测试人所在环境的客观测试与主观体验，仅供参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。测试人：{detailData.dataSource || 'xxx'}
        </div>
      </div>
    </div>
  );
}

// 数据区块组件
function DataSection({ title, children, data }: { title: string; children: React.ReactNode; data: DetailData }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-100">{title}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </div>
  );
}

// 数据项组件
function DataItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <div className="text-sm font-medium text-gray-700">
        <TitleWithTooltip title={label} />
      </div>
      <div className="text-base text-gray-900 mt-1">{value || '-'}</div>
    </div>
  );
}

// 获取评分文本
function getRatingText(score: number): string {
  if (score === 0) return '-';
  if (score >= 9) return `优秀 (${score})`;
  if (score >= 7) return `良好 (${score})`;
  if (score >= 5) return `一般 (${score})`;
  if (score >= 3) return `较差 (${score})`;
  return `差 (${score})`;
}