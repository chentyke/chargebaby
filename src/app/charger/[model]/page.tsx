import { notFound } from 'next/navigation';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { Power, ArrowLeft, Zap, Star } from 'lucide-react';
import SaveScreenshotButton from '@/components/save-screenshot-button';
import { getChargerByModel } from '@/lib/charger';
import { formatPrice, formatRating } from '@/lib/utils';
import { PageHeader } from '@/components/ui/back-button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { TitleWithTooltip } from '@/components/ui/title-with-tooltip';
import { ICPBeian } from '@/components/icp-beian';
import { PurchaseLinks, PRODUCT_SAMPLE_TOOLTIP } from '@/components/purchase-links';
import { ShareButton } from '@/components/share-button';
import { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Tooltip } from '@/components/ui/tooltip';

interface PageProps {
  params: Promise<{
    model: string;
  }>;
  searchParams: Promise<{
    from?: string;
    view?: 'grid' | 'list';
  }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { model } = await params;
  const charger = await getChargerByModel(decodeURIComponent(model));

  if (!charger) {
    return {
      title: '产品未找到 - 充电器数据库',
      description: '抱歉，您访问的产品页面不存在。',
    };
  }

  const {
    title,
    subtitle,
    brand,
    price,
    imageUrl,
    detailData
  } = charger;

  // 构建页面标题
  const pageTitle = `${title} - 充电器数据库`;

  // 构建描述 - 基于实际技术参数
  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : '价格待定';
  const powerText = detailData?.singlePortPower ? `${detailData.singlePortPower}W快充` : '';
  const multiPowerText = detailData?.multiPortPower ? `总${detailData.multiPortPower}W` : '';

  const description = [
    `${brand ? `${brand} ` : ''}${title}${subtitle ? ` - ${subtitle}` : ''}`,
    powerText && `⚡ ${powerText}`,
    multiPowerText && `🔌 ${multiPowerText}`,
    detailData?.weight && `📦 重${detailData.weight}g`,
    `💰 ${priceText}`
  ].filter(Boolean).join(' | ');

  return {
    title: pageTitle,
    description: description.slice(0, 160),
    keywords: [
      title,
      brand,
      '充电器',
      '充电头',
      '快充',
      'GaN',
      '氮化镓',
      '参数',
      '规格',
      'charger',
      detailData?.singlePortPower && `${detailData.singlePortPower}W`
    ].filter(Boolean).join(', '),
    authors: [{ name: '充电器数据库' }],
    creator: '充电器数据库',
    publisher: '充电器数据库',
    openGraph: {
      title: pageTitle,
      description: description.slice(0, 160),
      url: `/charger/${encodeURIComponent(model)}`,
      siteName: '充电器数据库',
      images: imageUrl ? [{
        url: imageUrl,
        width: 800,
        height: 800,
        alt: title,
        type: 'image/png',
      }] : [],
      locale: 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: description.slice(0, 160),
      images: imageUrl ? [imageUrl] : [],
      creator: '@chargebaby_review',
      site: '@chargebaby_review',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    alternates: {
      canonical: `/charger/${encodeURIComponent(model)}`,
    },
  };
}

export default async function ChargerDetailPage({ params, searchParams }: PageProps) {
  const { model } = await params;
  const { from, view } = await searchParams;
  const charger = await getChargerByModel(decodeURIComponent(model));

  if (!charger) {
    notFound();
  }

  const {
    brand,
    model: productModel,
    title,
    subtitle,
    tags,
    protocols,
    price,
    imageUrl,
    finalImageUrl,
    detailData,
    articleContent,
  } = charger;

  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : null;
  const rawSampleProvider = charger.productSource?.trim();
  const sampleProviderText = rawSampleProvider ? rawSampleProvider : null;
  const dataSourceText = detailData?.dataSource?.trim() || null;

  // 根据来源决定返回地址，并携带视图模式参数
  const getBackHref = () => {
    const basePath = from === 'ranking' ? '/ranking' : '/charger';
    return view ? `${basePath}?view=${view}` : basePath;
  };

  const backHref = getBackHref();
  const numberFormatter = new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 1 });
  const formatSpec = (value?: number | string | null, unit?: string) => {
    if (value === null || value === undefined) {
      return '-';
    }

    if (typeof value === 'number') {
      if (Number.isNaN(value)) {
        return '-';
      }
      const formatted = numberFormatter.format(value);
      return unit ? `${formatted}${unit}` : formatted;
    }

    const textValue = String(value).trim();
    if (!textValue) {
      return '-';
    }

    return unit && /^\d+(\.\d+)?$/.test(textValue)
      ? `${textValue}${unit}`
      : textValue;
  };

  const formatList = (items?: string[] | null) => {
    if (!Array.isArray(items) || items.length === 0) {
      return '-';
    }

    return items.join(' / ');
  };

  // 针对高级功能区域的特殊格式化函数
  const formatAdvancedList = (items?: string[] | null) => {
    if (!Array.isArray(items) || items.length === 0) {
      return '-';
    }

    // 对于过长的列表，只显示前两项并用 "+" 表示剩余项
    if (items.length > 2) {
      return `${items.slice(0, 2).join(' / ')} +${items.length - 2}`;
    }

    return items.join(' / ');
  };

  // 将多选数组渲染为标签组件
  const renderAsTags = (items?: string[] | null, variant: 'mobile' | 'desktop' = 'mobile', tagType: 'default' | 'protocol' = 'default') => {
    if (!Array.isArray(items) || items.length === 0) {
      return <span className="text-gray-400">-</span>;
    }

    const tagSize = variant === 'mobile'
      ? 'px-2 py-0.5 text-[10px] xs:px-2.5 xs:py-0.5 xs:text-[11px]'
      : 'px-2.5 py-1 text-xs';

    // 根据标签类型设置不同的颜色，统一使用灰色色阶
    const tagColor = tagType === 'protocol'
      ? 'bg-gray-50 text-gray-600 border border-gray-200 rounded-md'
      : 'bg-gray-50 text-gray-600 border border-gray-200 rounded-md';

    const containerClass = variant === 'mobile'
      ? 'flex flex-wrap gap-1.5 max-w-full'
      : 'flex flex-wrap gap-2 max-w-full';

    return (
      <div className={containerClass}>
        {items.map((item, index) => (
          <span
            key={`${item}-${index}`}
            className={`${tagSize} ${tagColor} inline-block font-medium`}
            title={item} // 显示完整文本作为提示
          >
            {item}
          </span>
        ))}
      </div>
    );
  };

  const hasValue = (value: unknown): boolean => {
    if (value === null || value === undefined) {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    if (typeof value === 'string') {
      return value.trim().length > 0;
    }

    return true;
  };

  type SpecRow = {
    key: string;
    label: string;
    value: number | string | string[] | null | undefined;
    unit?: string;
    isList?: boolean;
    hasTooltip?: boolean;
  };

  const quickSpecs: SpecRow[] = [
    { key: 'singlePortPower', label: '单口功率', value: detailData?.singlePortPower, unit: 'W' },
    { key: 'multiPortPower', label: '多口功率', value: detailData?.multiPortPower, unit: 'W' },
    { key: 'maxSurfaceTemp', label: '最高温度', value: detailData?.maxSurfaceTemp, unit: '℃' },
    { key: 'weight', label: '重量', value: detailData?.weight, unit: 'g' },
    { key: 'volume', label: '体积', value: detailData?.volume, unit: 'cm³' },
  ].filter((item) => hasValue(item.value));

  const powerRows: SpecRow[] = [
    { key: 'singlePortPower', label: '单口功率', value: detailData?.singlePortPower, unit: 'W' },
    { key: 'multiPortPower', label: '多口功率', value: detailData?.multiPortPower, unit: 'W' },
    { key: 'naturalCoolingPower', label: '自然散热功率', value: detailData?.naturalCoolingPower, unit: 'W' },
    { key: 'assistedCoolingPower', label: '辅助散热功率', value: detailData?.assistedCoolingPower, unit: 'W' },
  ].filter((item) => hasValue(item.value));

  const physicalRows: SpecRow[] = [
    { key: 'length', label: '长度', value: detailData?.length, unit: 'cm' },
    { key: 'width', label: '宽度', value: detailData?.width, unit: 'cm' },
    { key: 'thickness', label: '高度', value: detailData?.thickness, unit: 'cm' },
    { key: 'weight', label: '重量', value: detailData?.weight, unit: 'g' },
    { key: 'volume', label: '体积', value: detailData?.volume, unit: 'cm³' },
  ].filter((item) => hasValue(item.value));

  const protocolRows: SpecRow[] = [
    { key: 'pdSupportPrimary', label: 'PD协议(主)', value: detailData?.pdSupportPrimary, isList: true },
    { key: 'ppsSupportPrimary', label: 'PPS协议(主)', value: detailData?.ppsSupportPrimary, isList: true },
    { key: 'ufcsSupportPrimary', label: 'UFCS协议(主)', value: detailData?.ufcsSupportPrimary, isList: true },
    { key: 'privateProtocolSupportPrimary', label: '私有协议(主)', value: detailData?.privateProtocolSupportPrimary, isList: true },
  ].filter((item) => hasValue(item.value));

  const efficiencyRows: SpecRow[] = [
    { key: 'efficiency5V', label: '5V效率', value: detailData?.efficiency5V ? (detailData.efficiency5V * 100).toFixed(1) : null, unit: '%' },
    { key: 'efficiency9V', label: '9V效率', value: detailData?.efficiency9V ? (detailData.efficiency9V * 100).toFixed(1) : null, unit: '%' },
    { key: 'efficiency12V', label: '12V效率', value: detailData?.efficiency12V ? (detailData.efficiency12V * 100).toFixed(1) : null, unit: '%' },
    { key: 'efficiency15V', label: '15V效率', value: detailData?.efficiency15V ? (detailData.efficiency15V * 100).toFixed(1) : null, unit: '%' },
    { key: 'efficiency20V', label: '20V效率', value: detailData?.efficiency20V ? (detailData.efficiency20V * 100).toFixed(1) : null, unit: '%' },
    { key: 'efficiency28V', label: '28V效率', value: detailData?.efficiency28V ? (detailData.efficiency28V * 100).toFixed(1) : null, unit: '%' },
  ].filter((item) => hasValue(item.value));

  const rippleRows: SpecRow[] = [
    { key: 'ripple5V', label: '5V纹波', value: detailData?.ripple5V, unit: 'mV' },
    { key: 'ripple9V', label: '9V纹波', value: detailData?.ripple9V, unit: 'mV' },
    { key: 'ripple12V', label: '12V纹波', value: detailData?.ripple12V, unit: 'mV' },
    { key: 'ripple15V', label: '15V纹波', value: detailData?.ripple15V, unit: 'mV' },
    { key: 'ripple20V', label: '20V纹波', value: detailData?.ripple20V, unit: 'mV' },
    { key: 'ripple28V', label: '28V纹波', value: detailData?.ripple28V, unit: 'mV' },
  ].filter((item) => hasValue(item.value));

  const thermalRows: SpecRow[] = [
    { key: 'maxSurfaceTemp', label: '最高表面温度', value: detailData?.maxSurfaceTemp, unit: '℃' },
    { key: 'heatGeneration5V', label: '5V发热量', value: detailData?.heatGeneration5V, unit: 'W' },
    { key: 'heatGeneration9V', label: '9V发热量', value: detailData?.heatGeneration9V, unit: 'W' },
    { key: 'heatGeneration12V', label: '12V发热量', value: detailData?.heatGeneration12V, unit: 'W' },
    { key: 'heatGeneration15V', label: '15V发热量', value: detailData?.heatGeneration15V, unit: 'W' },
    { key: 'heatGeneration20V', label: '20V发热量', value: detailData?.heatGeneration20V, unit: 'W' },
    { key: 'heatGeneration28V', label: '28V发热量', value: detailData?.heatGeneration28V, unit: 'W' },
  ].filter((item) => hasValue(item.value));

  const currentRows: SpecRow[] = [
    { key: 'maxCurrent5V', label: '最大电流(5V)', value: detailData?.maxCurrent5V, unit: 'A' },
    { key: 'maxCurrent9V', label: '最大电流(9V)', value: detailData?.maxCurrent9V, unit: 'A' },
    { key: 'maxCurrent12V', label: '最大电流(12V)', value: detailData?.maxCurrent12V, unit: 'A' },
    { key: 'maxCurrent15V', label: '最大电流(15V)', value: detailData?.maxCurrent15V, unit: 'A' },
    { key: 'maxCurrent20V', label: '最大电流(20V)', value: detailData?.maxCurrent20V, unit: 'A' },
    { key: 'maxCurrent28V', label: '最大电流(28V)', value: detailData?.maxCurrent28V, unit: 'A' },
  ].filter((item) => hasValue(item.value));

  const advancedRows: SpecRow[] = [
    { key: 'powerAllocationGen', label: '功率分配代际', value: detailData?.powerAllocationGen },
    { key: 'thermalControl', label: '温控机制', value: detailData?.thermalControl, isList: true },
    { key: 'powerAllocationFeatures', label: '功率分配特性', value: detailData?.powerAllocationFeatures, isList: true },
    { key: 'cableDropCompensation', label: '线缆压降补偿', value: detailData?.cableDropCompensation, isList: true },
    { key: 'iotFunctions', label: 'IoT功能', value: detailData?.iotFunctions, isList: true },
    { key: 'displayType', label: '显示功能', value: detailData?.displayType, isList: true },
    { key: 'screenDisplayFunctions', label: '屏幕显示功能', value: detailData?.screenDisplayFunctions, isList: true },
    { key: 'otherTags', label: '其他标签', value: detailData?.otherTags, isList: true },
  ].filter((item) => hasValue(item.value));

  const hasProtocolData = protocolRows.length > 0 || (protocols && protocols.length > 0);
  const hasAnySpecData = powerRows.length > 0 || physicalRows.length > 0 || hasProtocolData ||
    efficiencyRows.length > 0 || rippleRows.length > 0 || thermalRows.length > 0 ||
    currentRows.length > 0 || advancedRows.length > 0;

  const renderSpecRows = (
    rows: SpecRow[],
    variant: 'mobile' | 'desktop',
    getValueClass: (key: string, view: 'mobile' | 'desktop') => string
  ) => rows.map((row) => {
    // 判断是否为协议字段，需要特殊处理
    const isProtocolField = ['pdSupportPrimary', 'ppsSupportPrimary', 'ufcsSupportPrimary', 'privateProtocolSupportPrimary'].includes(row.key);

    if (isProtocolField) {
      // 协议字段使用垂直布局，标签对齐
      return (
        <div key={`${variant}-${row.key}`} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            {row.hasTooltip ? (
              <TitleWithTooltip title={row.label} className="text-sm font-medium text-gray-700 flex-shrink-0" />
            ) : (
              <span className="text-sm font-medium text-gray-700 flex-shrink-0">{row.label}</span>
            )}
          </div>
          <div className="ml-1">
            {row.isList ? renderAsTags(row.value as string[], variant, 'protocol') :
             <span className={`${getValueClass(row.key, variant)} text-gray-900`}>
                {formatSpec(row.value as number | string | null | undefined, row.unit)}
              </span>}
          </div>
        </div>
      );
    }

    // 其他字段保持原有的水平布局
    return (
      <div key={`${variant}-${row.key}`} className="flex justify-between items-center">
        {row.hasTooltip ? (
          <TitleWithTooltip title={row.label} className="text-sm font-medium text-gray-700" />
        ) : (
          <span className="text-sm font-medium text-gray-700">{row.label}</span>
        )}
        <span className={`${getValueClass(row.key, variant)} text-gray-900`}>
          {row.isList
            ? formatList(row.value as string[])
            : formatSpec(row.value as number | string | null | undefined, row.unit)}
        </span>
      </div>
    );
  });

  // 专门用于高级功能的渲染函数，优化列表数据显示
  const renderAdvancedRows = (
    rows: SpecRow[],
    variant: 'mobile' | 'desktop',
    getValueClass: (key: string, view: 'mobile' | 'desktop') => string
  ) => rows.map((row) => {
    const isAdvancedRow = ['thermalControl', 'powerAllocationFeatures', 'cableDropCompensation', 'iotFunctions', 'displayType', 'screenDisplayFunctions', 'otherTags'].includes(row.key);

    return (
      <div key={`${variant}-${row.key}`} className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {row.hasTooltip ? (
            <TitleWithTooltip title={row.label} className="text-sm font-medium text-gray-700 flex-shrink-0" />
          ) : (
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">{row.label}</span>
          )}
        </div>
        <div className="ml-1">
          {row.isList
            ? renderAsTags(row.value as string[], variant, 'default')
            : <span className={`${getValueClass(row.key, variant)} text-gray-900`}>
                {formatSpec(row.value as number | string | null | undefined, row.unit)}
              </span>
          }
        </div>
      </div>
    );
  });

  const getPowerValueClass = (key: string, variant: 'mobile' | 'desktop') => {
    return variant === 'mobile'
      ? 'text-base font-semibold text-gray-900'
      : 'text-lg font-semibold text-gray-900';
  };

  const getPhysicalValueClass = (key: string, variant: 'mobile' | 'desktop') => {
    return variant === 'mobile'
      ? 'text-base font-semibold text-gray-900'
      : 'text-lg font-semibold text-gray-900';
  };

  const getProtocolValueClass = (key: string, variant: 'mobile' | 'desktop') => {
    return variant === 'mobile'
      ? 'text-base font-semibold text-gray-900'
      : 'text-lg font-semibold text-gray-900';
  };

  const getAdvancedValueClass = (key: string, variant: 'mobile' | 'desktop') => {
    return variant === 'mobile'
      ? 'text-sm font-medium text-gray-900'  // 移动端使用更小的字体
      : 'text-base font-medium text-gray-900'; // 桌面端也使用适中字体
  };

  const mobilePurchaseButtons = [
    charger.taobaoLink
      ? {
          key: 'taobao',
          label: '淘宝',
          href: charger.taobaoLink,
        }
      : null,
    charger.jdLink
      ? {
          key: 'jd',
          label: '京东',
          href: charger.jdLink,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; href: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-100/50 relative animate-slide-up">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-50/20 via-transparent to-red-50/20 pointer-events-none"></div>

      {/* 移动端：普通滚动布局 */}
      <div className="lg:hidden">
        <div className="container py-6 sm:py-10 relative">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-4 sm:mb-6" data-ignore-capture="true">
            <Link href={backHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </Link>
            <div className="flex items-center gap-3">
              <ShareButton
                title={`${title} - 充电器数据库`}
                text={`${title}
⚡ 单口功率：${detailData?.singlePortPower || '-'}W
🔌 多口功率：${detailData?.multiPortPower || '-'}W
📦 重量：${detailData?.weight || '-'}g
🌡️ 最高温度：${detailData?.maxSurfaceTemp || '-'}℃
💰 价格：${priceText || '待定'}

📊 完整技术参数`}
                showText={false}
              />
            </div>
          </div>

          <div id="capture-root" className="space-y-4">
            {/* 产品图片和标题左右放置 */}
            <div className="flex gap-4 items-start">
              {/* 产品图片 - 小尺寸 */}
              <div className="relative w-24 h-24 flex-shrink-0 overflow-hidden rounded-lg" data-detail-image>
                {imageUrl ? (
                  <NotionImage
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-contain animate-fade-in"
                    sizes="96px"
                    priority
                    enableZoom
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center animate-fade-in bg-gray-100">
                    <Power className="w-12 h-12 text-gray-300" />
                  </div>
                )}
              </div>

              {/* 标题和基本信息 */}
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-extrabold text-gray-900 leading-tight">
                  {title}
                </h1>
                {subtitle && (
                  <div className="text-xs text-gray-600 mt-1 line-clamp-2">{subtitle}</div>
                )}
                {/* 只在标题不以品牌开头时显示品牌和型号 */}
                {brand && !title.startsWith(brand) && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    {brand && <span>{brand} </span>}
                    {productModel && <span>{productModel}</span>}
                  </div>
                )}
                {/* 如果标题不包含品牌，只显示型号 */}
                {!brand && productModel && (
                  <div className="text-[11px] text-gray-500 mt-1">
                    {productModel}
                  </div>
                )}
                {/* 协议标签紧凑显示 */}
                {protocols && protocols.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {protocols.slice(0, 3).map((protocol: string) => (
                        <span
                          key={protocol}
                          className="px-2.5 py-0.5 rounded-full text-[11px] bg-orange-100 text-orange-700 border border-orange-200"
                        >
                          {protocol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 关键规格展示 */}
            {quickSpecs.length > 0 && (
              <div className="-mx-4 border-y border-gray-200/20 py-3">
                <div className="overflow-x-auto scrollbar-hide px-4">
                  <div className="flex min-w-max divide-x divide-gray-200/20 text-center">
                    {quickSpecs.map((item) => (
                      <div
                        key={item.key}
                        className="flex min-w-[96px] flex-col items-center justify-center px-4"
                      >
                        <span className="text-sm text-gray-600">{item.label}</span>
                        <span className="mt-1 text-base font-semibold text-gray-900 leading-tight">
                          {formatSpec(item.value as number | string | null | undefined, item.unit)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 价格和购买按钮 */}
            {(priceText || mobilePurchaseButtons.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {priceText && (
                  <div className="flex-shrink-0 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">官方定价</span>
                      <span className="ml-2 text-lg font-semibold text-gray-900">{priceText}</span>
                    </div>
                  </div>
                )}
                {mobilePurchaseButtons.length > 0 && (
                  <div className="ml-auto flex flex-wrap items-center gap-2">
                    {mobilePurchaseButtons.map((btn) => {
                      const themedClass =
                        btn.key === 'taobao'
                          ? 'border-orange-100 bg-orange-50 text-orange-600 hover:border-orange-200 hover:bg-orange-100 hover:text-orange-700'
                          : btn.key === 'jd'
                          ? 'border-red-100 bg-red-50 text-red-600 hover:border-red-200 hover:bg-red-100 hover:text-red-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-100 hover:text-gray-700';

                      return (
                        <a
                          key={btn.key}
                          href={btn.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center justify-center rounded-xl px-3.5 py-2 text-sm font-medium shadow-sm transition-colors ${themedClass}`}
                        >
                          {btn.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 垂直排列的技术参数区域 */}
            {hasAnySpecData && (
              <div className="space-y-4">
                {powerRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      ⚡ 功率参数
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(powerRows, 'mobile', getPowerValueClass)}
                    </div>
                  </div>
                )}

                {physicalRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      📏 物理参数
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(physicalRows, 'mobile', getPhysicalValueClass)}
                    </div>
                  </div>
                )}

                {protocolRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      🔌 协议支持
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(protocolRows, 'mobile', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {efficiencyRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      ⚡ 转换效率
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(efficiencyRows, 'mobile', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {rippleRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      〰️ 纹波测试
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(rippleRows, 'mobile', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {thermalRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      🌡️ 温度表现
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(thermalRows, 'mobile', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {currentRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      ⚡ 最大电流
                    </div>
                    <div className="space-y-3">
                      {renderSpecRows(currentRows, 'mobile', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {advancedRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-sm font-semibold text-gray-900 mb-4">
                      🔧 高级功能
                    </div>
                    <div className="space-y-4">
                      {renderAdvancedRows(advancedRows, 'mobile', getAdvancedValueClass)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 图文内容 */}
            {articleContent && (
              <div className="rounded-2xl border border-gray-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">图文内容</h3>
                <MarkdownRenderer content={articleContent} />
              </div>
            )}
          </div>

          {/* 免责声明 */}
          <div className="mt-10 text-[11px] leading-5 text-gray-400">
            产品参数与内容基于客观测试数据，仅供参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。数据来源：{dataSourceText || '未提供'}
          </div>

          {/* ICP备案信息 */}
          <ICPBeian variant="detail-mobile" />

          </div>
      </div>

      {/* 桌面端：分栏布局 */}
      <div className="hidden lg:block h-screen">
        <div className="container py-6 relative h-full flex flex-col">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0" data-ignore-capture="true">
            <Link href={backHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </Link>
            <div className="flex items-center gap-3">
              <ShareButton
                title={`${title} - 充电器数据库`}
                text={`${title}
⚡ 单口功率：${detailData?.singlePortPower || '-'}W
🔌 多口功率：${detailData?.multiPortPower || '-'}W
📦 重量：${detailData?.weight || '-'}g
🌡️ 最高温度：${detailData?.maxSurfaceTemp || '-'}℃
💰 价格：${priceText || '待定'}

📊 完整技术参数`}
                showText={true}
              />
            </div>
          </div>

          <div id="capture-root" className="grid grid-cols-2 gap-10 flex-1 min-h-0">
            {/* 左侧：图片（固定，不滚动） */}
            <div className="flex flex-col h-full">
              {/* 产品图片 */}
              <div className="relative aspect-square overflow-hidden w-full" data-detail-image>
                {imageUrl ? (
                  <NotionImage
                    src={imageUrl}
                    alt={title}
                    fill
                    className="object-contain animate-fade-in"
                    sizes="50vw"
                    priority
                    enableZoom
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center animate-fade-in">
                    <Power className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* 购买链接按钮 */}
              {charger.taobaoLink || charger.jdLink ? (
                <div className="mt-8 flex-shrink-0">
                  <div className="ml-0">
                    <PurchaseLinks chargeBaby={charger} variant="desktop" />
                  </div>
                </div>
              ) : null}
            </div>

            {/* 右侧：标题 + 评分数据 + 图文（可滚动） */}
            <div className="overflow-y-auto auto-hide-scrollbar">
              <div className="space-y-8 pr-4">
                {/* 标题与标签 */}
                <div>
                  {/* 只在标题不以品牌开头时显示品牌和型号 */}
                  {brand && !title.startsWith(brand) && (
                    <div className="text-base text-gray-600 mb-1">{brand ? `${brand} ${productModel}` : productModel}</div>
                  )}
                  {/* 如果标题不包含品牌，只显示型号 */}
                  {!brand && productModel && (
                    <div className="text-base text-gray-600 mb-1">{productModel}</div>
                  )}
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <div className="text-lg text-gray-600 mt-1">{subtitle}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {protocols && protocols.slice(0, 3).map((protocol: string) => (
                      <span key={protocol} className="px-3 py-1 rounded-md text-sm bg-orange-100 text-orange-700 border border-orange-200">
                        {protocol}
                      </span>
                    ))}
                  </div>
                  {priceText && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div>
                        <span>官方定价 </span>
                        <span className="font-extrabold text-gray-900">{priceText}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* 核心技术参数 */}
                {(powerRows.length > 0 || physicalRows.length > 0) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {powerRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="text-xl text-gray-900 font-semibold mb-4">
                          ⚡ 功率参数
                        </div>
                        <div className="space-y-4">
                          {renderSpecRows(powerRows, 'desktop', getPowerValueClass)}
                        </div>
                      </div>
                    )}

                    {physicalRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="text-xl text-gray-900 font-semibold mb-4">
                          📏 物理参数
                        </div>
                        <div className="space-y-4">
                          {renderSpecRows(physicalRows, 'desktop', getPhysicalValueClass)}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 协议参数 */}
                {protocolRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      🔌 协议支持
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(protocolRows, 'desktop', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {/* 转换效率参数 */}
                {efficiencyRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      ⚡ 转换效率
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(efficiencyRows, 'desktop', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {/* 纹波测试参数 */}
                {rippleRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      〰️ 纹波测试
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(rippleRows, 'desktop', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {/* 温度表现参数 */}
                {thermalRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      🌡️ 温度表现
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(thermalRows, 'desktop', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {/* 最大电流参数 */}
                {currentRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      ⚡ 最大电流
                    </div>
                    <div className="space-y-4">
                      {renderSpecRows(currentRows, 'desktop', getProtocolValueClass)}
                    </div>
                  </div>
                )}

                {/* 高级功能参数 */}
                {advancedRows.length > 0 && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <div className="text-xl text-gray-900 font-semibold mb-4">
                      🔧 高级功能
                    </div>
                    <div className="space-y-4"> {/* 统一间距 */}
                      {renderAdvancedRows(advancedRows, 'desktop', getAdvancedValueClass)}
                    </div>
                  </div>
                )}

                {/* 图文内容 */}
                {articleContent && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">图文内容</h3>
                    <MarkdownRenderer content={articleContent} />
                  </div>
                )}

                {/* 免责声明 */}
                <div className="text-[11px] leading-5 text-gray-400 border-t border-gray-200 pt-6">
                  产品参数与内容基于客观测试数据，仅供参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。数据来源：{dataSourceText || '未提供'}
                </div>

                {/* ICP备案信息 */}
                <ICPBeian variant="detail-desktop" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}