import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getChargeBabyById } from '@/lib/notion';
import { DetailData } from '@/types/chargebaby';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DetailDataPage({ params }: PageProps) {
  const { id } = await params;
  const chargeBaby = await getChargeBabyById(id);

  if (!chargeBaby || !chargeBaby.detailData) {
    notFound();
  }

  const { title, detailData } = chargeBaby;

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-6 sm:py-10">
        {/* 顶部导航 */}
        <div className="flex items-center gap-4 mb-6">
          <Link href={`/charge-baby/${id}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
            <span>返回详情</span>
          </Link>
          <div className="text-sm text-gray-500">详细数据</div>
        </div>

        {/* 标题 */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title} - 详细测试数据</h1>
          <p className="mt-2 text-gray-600">以下数据来自实验室环境的专业测试，仅供参考</p>
        </div>

        {/* 数据展示 */}
        <div className="space-y-8">
          {/* 物理规格 */}
          <DataSection title="物理规格" data={detailData}>
            <DataItem label="尺寸" value={`${detailData.length} × ${detailData.width} × ${detailData.thickness} cm`} />
            <DataItem label="重量" value={`${detailData.weight}g`} />
            <DataItem label="体积" value={`${detailData.volume}cm³`} />
            <DataItem label="容量重量比" value={`${detailData.capacityWeightRatio} Wh/g`} />
            <DataItem label="容量体积比" value={`${detailData.capacityVolumeRatio} Wh/cm³`} />
          </DataSection>

          {/* 电池容量 */}
          <DataSection title="电池容量" data={detailData}>
            <DataItem label="容量级别" value={`${detailData.capacityLevel}mAh`} />
            <DataItem label="最大放电容量" value={`${detailData.maxDischargeCapacity}Wh`} />
            <DataItem label="自充能量" value={`${detailData.selfChargingEnergy}Wh`} />
            <DataItem label="能量达成率" value={`${(detailData.energyAchievementRate * 100).toFixed(1)}%`} />
            <DataItem label="放电容量达成率" value={`${(detailData.dischargeCapacityAchievementRate * 100).toFixed(1)}%`} />
          </DataSection>

          {/* 充电性能 */}
          <DataSection title="充电性能" data={detailData}>
            <DataItem label="自充时间" value={`${detailData.selfChargingTime}分钟`} />
            <DataItem label="平均自充功率" value={`${detailData.avgSelfChargingPower}W`} />
            <DataItem label="20分钟充入能量" value={`${detailData.energy20min}Wh`} />
          </DataSection>

          {/* 输出性能 */}
          <DataSection title="输出性能" data={detailData}>
            <DataItem label="最大持续输出功率" value={`${detailData.maxContinuousOutputPower}W`} />
            <DataItem label="最大放电能力" value={`${detailData.maxDischargeCapability}`} />
            <DataItem label="最大能量转换率" value={`${(detailData.maxEnergyConversionRate * 100).toFixed(1)}%`} />
            <DataItem label="转换率" value={`${(detailData.conversionRate * 100).toFixed(1)}%`} />
          </DataSection>

          {/* 充电协议支持 */}
          <DataSection title="充电协议支持" data={detailData}>
            <DataItem label="PD协议" value={getRatingText(detailData.pdSupport)} />
            <DataItem label="QC协议" value={getRatingText(detailData.qcSupport)} />
            <DataItem label="PPS协议" value={getRatingText(detailData.ppsSupport)} />
            <DataItem label="UFCS协议" value={getRatingText(detailData.ufcsSupport)} />
            <DataItem label="私有协议" value={getRatingText(detailData.privateProtocol)} />
            <DataItem label="协议兼容性" value={getRatingText(detailData.protocolCompatibility)} />
          </DataSection>

          {/* 多接口功能 */}
          <DataSection title="多接口功能" data={detailData}>
            <DataItem label="双接口同时输出" value={getRatingText(detailData.dualPortOutput)} />
            <DataItem label="多口插拔不断联" value={getRatingText(detailData.hotSwap)} />
            <DataItem label="边冲边放" value={getRatingText(detailData.passThrough)} />
            <DataItem label="输入输出方向自定义" value={getRatingText(detailData.customDirection)} />
          </DataSection>

          {/* 温度控制 */}
          <DataSection title="温度控制" data={detailData}>
            <DataItem label="温度表现" value={`${detailData.temperature}分`} />
            <DataItem label="最高温度" value={`${detailData.maxTemperature}°C`} />
            <DataItem label="温度均匀度" value={`${detailData.temperatureUniformity}分`} />
            <DataItem label="温控策略" value={`${detailData.temperatureControlStrategy}分`} />
          </DataSection>

          {/* 显示功能 */}
          <DataSection title="显示功能" data={detailData}>
            <DataItem label="显示功能" value={getRatingText(detailData.display)} />
            <DataItem label="显示内容" value={getRatingText(detailData.displayContent)} />
            <DataItem label="显示载体" value={getRatingText(detailData.displayCarrier)} />
            <DataItem label="显示调节" value={getRatingText(detailData.displayAdjustment)} />
            <DataItem label="亮度" value={getRatingText(detailData.brightness)} />
          </DataSection>

          {/* 线缆和电源质量 */}
          <DataSection title="线缆和电源质量" data={detailData}>
            <DataItem label="线缆长度" value={getRatingText(detailData.cableLength)} />
            <DataItem label="线缆柔软度" value={getRatingText(detailData.cableSoftness)} />
            <DataItem label="纹波" value={getRatingText(detailData.ripple)} />
          </DataSection>

          {/* 特殊功能 */}
          <DataSection title="特殊功能" data={detailData}>
            <DataItem label="IoT能力" value={getRatingText(detailData.iotCapability)} />
            <DataItem label="自定义能力" value={getRatingText(detailData.customizationCapability)} />
            <DataItem label="AC输入能力" value={getRatingText(detailData.acInputCapability)} />
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
          本页面所有测试数据均基于实验室环境下的客观测试，仅供技术参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。
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
      <div className="text-sm font-medium text-gray-700">{label}</div>
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