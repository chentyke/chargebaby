import { notFound } from 'next/navigation';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { Cable, ArrowLeft, GitCompare, Zap, Star } from 'lucide-react';
import SaveScreenshotButton from '@/components/save-screenshot-button';
import { getCableByModel } from '@/lib/cable';
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
  const cable = await getCableByModel(decodeURIComponent(model));

  if (!cable) {
    return {
      title: '产品未找到 - 充电线数据库',
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
  } = cable;

  // 构建页面标题
  const pageTitle = `${title} - 充电线数据库`;

  // 构建描述 - 基于实际技术参数
  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : '价格待定';
  const powerText = detailData?.maxPower ? `${detailData.maxPower}W快充` : '';
  const lengthText = detailData?.length ? `${detailData.length}m` : '';

  const description = [
    `${brand ? `${brand} ` : ''}${title}${subtitle ? ` - ${subtitle}` : ''}`,
    powerText && `⚡ ${powerText}`,
    lengthText && `📏 ${lengthText}`,
    detailData?.maxVoltage && `🔋 最高${detailData.maxVoltage}V`,
    detailData?.maxCurrent && `⚡ 最大${detailData.maxCurrent}A`,
    `💰 ${priceText}`
  ].filter(Boolean).join(' | ');

  return {
    title: pageTitle,
    description: description.slice(0, 160),
    keywords: [
      title,
      brand,
      '充电线',
      '数据线',
      '快充线',
      'USB-C',
      '参数',
      '规格',
      'cable',
      detailData?.maxPower && `${detailData.maxPower}W`
    ].filter(Boolean).join(', '),
    authors: [{ name: '充电线数据库' }],
    creator: '充电线数据库',
    publisher: '充电线数据库',
    openGraph: {
      title: pageTitle,
      description: description.slice(0, 160),
      url: `/cable/${encodeURIComponent(model)}`,
      siteName: '充电线数据库',
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
      canonical: `/cable/${encodeURIComponent(model)}`,
    },
  };
}

export default async function CableDetailPage({ params, searchParams }: PageProps) {
  const { model } = await params;
  const { from, view } = await searchParams;
  const cable = await getCableByModel(decodeURIComponent(model));

  if (!cable) {
    notFound();
  }

  const {
    brand,
    model: productModel,
    title,
    subtitle,
    tags,
    price,
    imageUrl,
    finalImageUrl,
    detailData,
    articleContent,
  } = cable;

  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : null;
  const rawSampleProvider = cable.productSource?.trim();
  const sampleProviderText = rawSampleProvider ? rawSampleProvider : null;
  const dataSourceText = detailData?.dataSource?.trim() || null;

  // 根据来源决定返回地址，并携带视图模式参数
  const getBackHref = () => {
    const basePath = from === 'ranking' ? '/ranking' : '/cable';
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
    { key: 'length', label: '长度', value: detailData?.length, unit: 'm' },
    { key: 'weight', label: '重量', value: detailData?.weight, unit: 'g' },
    { key: 'max-power', label: '最大功率', value: detailData?.maxPower, unit: 'W' },
    { key: 'max-voltage', label: '最大电压', value: detailData?.maxVoltage, unit: 'V' },
    { key: 'max-current', label: '最大电流', value: detailData?.maxCurrent, unit: 'A' },
    { key: 'resistance', label: '线阻', value: detailData?.resistance, unit: 'mΩ' },
  ].filter((item) => hasValue(item.value));

  const powerRows: SpecRow[] = [
    { key: 'maxPower', label: '最大功率', value: detailData?.maxPower, unit: 'W' },
    { key: 'maxVoltage', label: '最大电压', value: detailData?.maxVoltage, unit: 'V' },
    { key: 'maxCurrent', label: '最大电流', value: detailData?.maxCurrent, unit: 'A' },
  ].filter((item) => hasValue(item.value));

  const physicalRows: SpecRow[] = [
    { key: 'length', label: '长度', value: detailData?.length, unit: 'm' },
    { key: 'weight', label: '重量', value: detailData?.weight, unit: 'g' },
    { key: 'diameter', label: '线径', value: detailData?.diameter, unit: 'mm' },
    { key: 'diameter2', label: '线径2', value: detailData?.diameter2, unit: 'mm' },
    { key: 'connectorMaterial', label: '端子材质', value: detailData?.connectorMaterial },
  ].filter((item) => hasValue(item.value));

  const performanceRows: SpecRow[] = [
    { key: 'resistance', label: '线阻', value: detailData?.resistance, unit: 'mΩ' },
    { key: 'lineResistanceScore', label: '线阻评分', value: detailData?.lineResistanceScore },
    { key: 'maxTransferRate', label: '传输速率', value: detailData?.maxTransferRate, unit: 'Gbps' },
    { key: 'cableProcess', label: '线缆工艺', value: detailData?.cableProcess },
    { key: 'videoTransmission', label: '视频传输', value: detailData?.videoTransmissionCapability, isList: true },
    { key: 'reDriverReTimer', label: 'ReDriver/ReTimer', value: detailData?.reDriverReTimer, hasTooltip: true },
  ].filter((item) => hasValue(item.value));

  const chargingProtocols = (detailData?.chargingProtocols || []).filter(Boolean);
  const usbProtocols = (detailData?.usbProtocolCompatibility || []).filter(Boolean);
  const thunderboltProtocols = (detailData?.thunderboltCompatibility || []).filter(Boolean);
  const hasProtocolData = chargingProtocols.length > 0 || usbProtocols.length > 0 || thunderboltProtocols.length > 0;
  const hasAnySpecData = powerRows.length > 0 || physicalRows.length > 0 || performanceRows.length > 0 || hasProtocolData;

  const renderSpecRows = (
    rows: SpecRow[],
    variant: 'mobile' | 'desktop',
    getValueClass: (key: string, view: 'mobile' | 'desktop') => string
  ) => rows.map((row) => {
    // ReDriver/ReTimer字段使用垂直排列
    if (row.key === 'reDriverReTimer') {
      return (
        <div key={`${variant}-${row.key}`} className="flex flex-col gap-1">
          {row.hasTooltip ? (
            <TitleWithTooltip title={row.label} className="text-sm text-gray-600" />
          ) : (
            <span className="text-sm text-gray-600">{row.label}</span>
          )}
          <span className={getValueClass(row.key, variant)}>
            {row.isList
              ? formatList(row.value as string[])
              : formatSpec(row.value as number | string | null | undefined, row.unit)}
          </span>
        </div>
      );
    }

    // 其他字段保持水平排列
    return (
      <div key={`${variant}-${row.key}`} className="flex justify-between items-center">
        {row.hasTooltip ? (
          <TitleWithTooltip title={row.label} className="text-sm text-gray-600" />
        ) : (
          <span className="text-sm text-gray-600">{row.label}</span>
        )}
        <span className={getValueClass(row.key, variant)}>
          {row.isList
            ? formatList(row.value as string[])
            : formatSpec(row.value as number | string | null | undefined, row.unit)}
        </span>
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

  const getPerformanceValueClass = (key: string, variant: 'mobile' | 'desktop') => {
    return variant === 'mobile'
      ? 'text-base font-semibold text-gray-900'
      : 'text-lg font-semibold text-gray-900';
  };

  const mobilePurchaseButtons = [
    cable.taobaoLink
      ? {
          key: 'taobao',
          label: '淘宝',
          href: cable.taobaoLink,
        }
      : null,
    cable.jdLink
      ? {
          key: 'jd',
          label: '京东',
          href: cable.jdLink,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; href: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-100/50 relative animate-slide-up">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-green-50/20 via-transparent to-blue-50/20 pointer-events-none"></div>

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
                title={`${title} - 充电线数据库`}
                text={`${title}
⚡ 功率：${detailData?.maxPower || '-'}W
📏 长度：${detailData?.length || '-'}m
🔋 电压：${detailData?.maxVoltage || '-'}V
⚡ 电流：${detailData?.maxCurrent || '-'}A
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
                    <Cable className="w-12 h-12 text-gray-300" />
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
                {/* 标签紧凑显示 */}
                {Array.isArray(tags) && tags.length > 0 && (
                  <div className="mt-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      {tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-[11px] bg-green-100 text-green-700 border border-green-200"
                        >
                          {tag}
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

            {/* 横向滚动的技术参数卡片区域 */}
            {hasAnySpecData && (
              <div className="-mx-4">
                <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                  <div className="flex gap-4 pb-4" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
                    {powerRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[280px]">
                        <div className="text-sm font-semibold text-gray-900 mb-4">
                          ⚡ 功率参数
                        </div>
                        <div className="space-y-3">
                          {renderSpecRows(powerRows, 'mobile', getPowerValueClass)}
                        </div>
                      </div>
                    )}

                    {physicalRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[280px]">
                        <div className="text-sm font-semibold text-gray-900 mb-4">
                          📏 物理参数
                        </div>
                        <div className="space-y-3">
                          {renderSpecRows(physicalRows, 'mobile', getPhysicalValueClass)}
                        </div>
                      </div>
                    )}

                    {performanceRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[280px]">
                        <div className="text-sm font-semibold text-gray-900 mb-4">
                          🔧 性能参数
                        </div>
                        <div className="space-y-3">
                          {renderSpecRows(performanceRows, 'mobile', getPerformanceValueClass)}
                        </div>
                      </div>
                    )}

                    {hasProtocolData && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[280px]">
                        <div className="text-sm font-semibold text-gray-900 mb-4">
                          🔌 协议支持
                        </div>
                        <div className="space-y-3">
                          {chargingProtocols.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {chargingProtocols.map((protocol) => (
                                <span key={protocol} className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                                  {protocol}
                                </span>
                              ))}
                            </div>
                          )}

                          {usbProtocols.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">USB 协议</div>
                              <div className="flex flex-wrap gap-2">
                                {usbProtocols.map((protocol) => (
                                  <span key={protocol} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {thunderboltProtocols.length > 0 && (
                            <div>
                              <div className="text-xs text-gray-500 mb-1">雷电支持</div>
                              <div className="flex flex-wrap gap-2">
                                {thunderboltProtocols.map((protocol) => (
                                  <span key={protocol} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="shrink-0 w-2" aria-hidden="true" />
                  </div>
                </div>
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
                title={`${title} - 充电线数据库`}
                text={`${title}
⚡ 功率：${detailData?.maxPower || '-'}W
📏 长度：${detailData?.length || '-'}m
🔋 电压：${detailData?.maxVoltage || '-'}V
⚡ 电流：${detailData?.maxCurrent || '-'}A
💰 价格：${priceText || '待定'}

📊 完整技术参数`}
                showText={true}
              />
            </div>
          </div>

          <div id="capture-root" className="grid grid-cols-2 gap-10 flex-1 min-h-0">
            {/* 左侧：图片 + 优劣势（固定，不滚动） */}
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
                    <Cable className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

  
              {/* 购买链接按钮 */}
              {cable.taobaoLink || cable.jdLink ? (
                <div className="mt-8 flex-shrink-0">
                  <div className="ml-0">
                    <PurchaseLinks chargeBaby={cable} variant="desktop" />
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
                    {Array.isArray(tags) && tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 rounded-md text-sm bg-green-100 text-green-700 border border-green-200">
                        {tag}
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

                {/* 性能和协议参数 */}
                {(performanceRows.length > 0 || hasProtocolData) && (
                  <div className="grid gap-6 md:grid-cols-2">
                    {performanceRows.length > 0 && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="text-xl text-gray-900 font-semibold mb-4">
                          🔧 性能参数
                        </div>
                        <div className="space-y-4">
                          {renderSpecRows(performanceRows, 'desktop', getPerformanceValueClass)}
                        </div>
                      </div>
                    )}

                    {hasProtocolData && (
                      <div className="rounded-2xl border border-gray-200 bg-white p-5">
                        <div className="text-xl text-gray-900 font-semibold mb-4">
                          🔌 协议支持
                        </div>
                        <div className="space-y-4">
                          {chargingProtocols.length > 0 && (
                            <div>
                              <div className="flex flex-wrap gap-2">
                                {chargingProtocols.map((protocol) => (
                                  <span key={protocol} className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {usbProtocols.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-2">USB 协议</div>
                              <div className="flex flex-wrap gap-2">
                                {usbProtocols.map((protocol) => (
                                  <span key={protocol} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {thunderboltProtocols.length > 0 && (
                            <div>
                              <div className="text-sm text-gray-600 mb-2">雷电支持</div>
                              <div className="flex flex-wrap gap-2">
                                {thunderboltProtocols.map((protocol) => (
                                  <span key={protocol} className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs font-medium">
                                    {protocol}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
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
