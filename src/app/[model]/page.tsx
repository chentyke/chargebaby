import { notFound } from 'next/navigation';
import { NotionImage } from '@/components/notion-image';
import Link from 'next/link';
import { Battery, ArrowLeft, GitCompare } from 'lucide-react';
import SaveScreenshotButton from '@/components/save-screenshot-button';
import { getChargeBabyByModel } from '@/lib/notion';
import { formatPrice, formatRating, getRatingProgress, formatDate } from '@/lib/utils';
import { PageHeader } from '@/components/ui/back-button';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { TitleWithTooltip } from '@/components/ui/title-with-tooltip';
import { ReviewCards } from '@/components/review-cards';
import { ICPBeian } from '@/components/icp-beian';
import { PurchaseLinks, PRODUCT_SAMPLE_TOOLTIP } from '@/components/purchase-links';
import { ShareButton } from '@/components/share-button';
import { DetailDataPreviewCard } from '@/components/detail-data-preview-card';
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
  const chargeBaby = await getChargeBabyByModel(decodeURIComponent(model));

  if (!chargeBaby) {
    return {
      title: '产品未找到 - 充电宝测评',
      description: '抱歉，您访问的产品页面不存在。',
    };
  }

  const {
    title,
    subtitle,
    brand,
    overallRating,
    performanceRating,
    experienceRating,
    price,
    imageUrl,
    advantages = [],
    disadvantages = []
  } = chargeBaby;

  // 构建页面标题
  const pageTitle = `${title} - 充电宝测评`;
  
  // 构建描述
  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : '价格待定';
  const advantagesText = advantages.length > 0 ? `优势：${advantages.slice(0, 2).join('、')}` : '';
  const disadvantagesText = disadvantages.length > 0 ? `不足：${disadvantages.slice(0, 1).join('、')}` : '';
  
  const description = [
    `${brand ? `${brand} ` : ''}${title}${subtitle ? ` - ${subtitle}` : ''}`,
    `🔋 综合评分 ${Math.round(overallRating ?? 0)}/100分`,
    `⚡ 性能评分 ${Math.round(performanceRating ?? 0)}/100分`,
    `📱 体验评分 ${Math.round(experienceRating ?? 0)}/100分`,
    `💰 ${priceText}`,
    advantagesText,
    disadvantagesText
  ].filter(Boolean).join(' | ');

  return {
    title: pageTitle,
    description: description.slice(0, 160), // 限制描述长度
    keywords: [
      title,
      brand,
      '充电宝',
      '移动电源',
      '测评',
      '评测',
      '对比',
      `${Math.round(overallRating ?? 0)}分`,
      '快充',
      'powerbank'
    ].filter(Boolean).join(', '),
    authors: [{ name: '充电宝测评' }],
    creator: '充电宝测评',
    publisher: '充电宝测评',
    openGraph: {
      title: pageTitle,
      description: description.slice(0, 160),
      url: `/${encodeURIComponent(model)}`,
      siteName: '充电宝测评',
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
      canonical: `/${encodeURIComponent(model)}`,
    },
  };
}

export default async function ChargeBabyDetailPage({ params, searchParams }: PageProps) {
  const { model } = await params;
  const { from, view } = await searchParams;
  const chargeBaby = await getChargeBabyByModel(decodeURIComponent(model));

  if (!chargeBaby) {
    notFound();
  }

  const {
    brand,
    model: productModel,
    title,
    subtitle,
    tags,
    price,
    releaseDate,
    overallRating,
    performanceRating,
    selfChargingCapability,
    outputCapability,
    energy,
    experienceRating,
    portability,
    chargingProtocols,
    multiPortUsage,
    advantages,
    disadvantages,
    imageUrl,
    finalImageUrl,
    detailData,
    articleContent,
  } = chargeBaby;

  const gradeLabels = ['入门级', '进阶级', '高端级', '旗舰级', '超旗舰级'];
  const perfLevelLabels = ['低性能', '中性能', '中高性能', '高性能', '超高性能'];
  const expLevelLabels = ['低水平', '中水平', '中高水平', '高水平', '超高水平'];

  const priceText = typeof price === 'number' ? `¥${Math.round(price)}` : null;
  const releaseMonthText = releaseDate
    ? (() => {
        const d = new Date(releaseDate as string);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        return `${y}年${m}月发售`;
      })()
    : null;
  const sampleProviderText = chargeBaby.productSource || detailData?.dataSource || null;

  // 根据来源决定返回地址，并携带视图模式参数
  const getBackHref = () => {
    const basePath = from === 'ranking' ? '/ranking' : '/';
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

  const quickSpecs: Array<{ key: string; label: string; value: string; helper?: string }> = [
    {
      key: 'weight',
      label: '重量',
      value: formatSpec(detailData?.weight, 'g'),
    },
    {
      key: 'volume',
      label: '体积',
      value: formatSpec(detailData?.volume, 'cm³'),
    },
    {
      key: 'max-discharge',
      label: '最大放电能量',
      value: formatSpec(detailData?.maxDischargeCapacity, 'Wh'),
    },
    {
      key: 'self-charging-time',
      label: '自充电时间',
      value: formatSpec(detailData?.selfChargingTime, '分钟'),
    },
    {
      key: 'max-output',
      label: '最大输出功率',
      value: formatSpec(detailData?.maxOutputPower, 'W'),
    },
  ];

  const mobilePurchaseButtons = [
    chargeBaby.taobaoLink
      ? {
          key: 'taobao',
          label: '淘宝',
          href: chargeBaby.taobaoLink,
        }
      : null,
    chargeBaby.jdLink
      ? {
          key: 'jd',
          label: '京东',
          href: chargeBaby.jdLink,
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; href: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative animate-slide-up">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      
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
              <Link href={`/compare?product=${encodeURIComponent(productModel)}&from=detail`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <GitCompare className="w-5 h-5" />
                <span>对比</span>
              </Link>
              <ShareButton
                title={`${title} - 充电宝测评`}
                text={`${title}
🔋 综合评分：${Math.round(overallRating ?? 0)}/100分
⚡ 性能评分：${Math.round(performanceRating ?? 0)}/100分
📱 体验评分：${Math.round(experienceRating ?? 0)}/100分
${priceText ? `💰 官方定价：${priceText}` : ''}

📊 详细测评数据和对比`}
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
                    <Battery className="w-12 h-12 text-gray-300" />
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
                <div className="text-[11px] text-gray-500 mt-1">
                  {brand && <span>{brand} </span>}
                  {productModel && <span>{productModel}</span>}
                </div>
                {/* 标签与发布日期紧凑显示 */}
                {((Array.isArray(tags) && tags.length > 0) || sampleProviderText) && (
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    {Array.isArray(tags) &&
                      tags.slice(0, 3).map((tag: string) => (
                        <span
                          key={tag}
                          className="px-2.5 py-0.5 rounded-full text-[11px] bg-gray-100 text-gray-700 border border-gray-200"
                        >
                          {tag}
                        </span>
                      ))}
                    {sampleProviderText && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
                        <span>本次测试样机由</span>
                        <span className="font-medium text-gray-600">{sampleProviderText}</span>
                        <span>提供</span>
                        <Tooltip content={PRODUCT_SAMPLE_TOOLTIP} className="ml-0.5" />
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 关键规格展示 */}
            <div className="-mx-4 border-y border-gray-200/20 py-3">
              <div className="overflow-x-auto scrollbar-hide px-4">
                <div className="flex min-w-max divide-x divide-gray-200/20 text-center">
                  {quickSpecs.map((item) => (
                    <div
                      key={item.key}
                      className="flex min-w-[96px] flex-col items-center justify-center px-4"
                    >
                      <span className="text-xs text-gray-500">{item.label}</span>
                      <span className="mt-1 text-base font-semibold text-gray-700 leading-tight">{item.value}</span>
                      {item.helper && (
                        <span className="mt-0.5 text-[11px] text-gray-400">{item.helper}</span>
                      )}
                    </div>
                  ))}
                  {detailData ? (
                    <Link
                      href={`/${encodeURIComponent(model)}/detail`}
                      className="flex min-w-[132px] flex-col items-center justify-center px-4 text-center text-gray-600"
                    >
                      <span className="text-xs text-gray-500">详细数据</span>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        查看全部
                        <span className="text-sm">→</span>
                      </span>
                      <span className="mt-1 text-[11px] text-gray-400">
                        {detailData.dataSource ? `数据源：${detailData.dataSource}` : '完整测试明细'}
                      </span>
                    </Link>
                  ) : (
                    <div className="flex min-w-[132px] flex-col items-center justify-center px-4 text-gray-400">
                      <span className="text-xs">详细数据</span>
                      <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium">暂无更多</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {(priceText || releaseMonthText || mobilePurchaseButtons.length > 0) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {(priceText || releaseMonthText) && (
                  <div className="flex-shrink-0 text-sm text-gray-600">
                    <div>
                      <span className="text-gray-500">官方定价</span>
                      {priceText && (
                        <span className="ml-2 text-lg font-semibold text-gray-900">{priceText}</span>
                      )}
                    </div>
                    {releaseMonthText && (
                      <div className="mt-0.5 text-[11px] text-gray-500">{releaseMonthText}</div>
                    )}
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

            {/* 横向滚动的评分卡片区域 - 限位滚动 */}
            <div className="-mx-4">
              <div className="overflow-x-auto scrollbar-hide snap-x snap-mandatory">
                <div className="flex gap-4 pb-4" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
                  {/* 综合评分卡片 - 圆环样式 */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-5 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[320px] flex flex-col gap-5">
                    <div className="text-sm font-semibold text-gray-900">
                      <TitleWithTooltip title="综合评分" />
                    </div>
                    <div className="flex flex-col items-center gap-3 text-center">
                      <CircularRating
                        value={overallRating ?? 0}
                        size={112}
                        centerContent={
                          <span className="text-sm font-semibold text-gray-700">
                            {gradeLabels[Math.min(gradeLabels.length - 1, Math.floor((overallRating ?? 0) / 20))]}
                          </span>
                        }
                      />
                      <div className="text-xs uppercase tracking-wide text-gray-500">综合得分</div>
                      <div className="text-4xl font-extrabold text-gray-900 leading-tight">
                        {Math.round(overallRating ?? 0)}
                        <span className="ml-1 text-lg text-gray-400 align-top">/100</span>
                      </div>
                      {detailData?.dataSource && (
                        <div className="text-xs text-gray-400">数据源：{detailData.dataSource}</div>
                      )}
                    </div>

                    {/* 性能和体验评分简要显示 */}
                    <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">性能评分</div>
                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {Math.round(performanceRating ?? 0)}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {perfLevelLabels[Math.min(perfLevelLabels.length - 1, Math.floor((performanceRating ?? 0) / 20))]}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">体验评分</div>
                        <div className="mt-1 text-lg font-bold text-gray-900">
                          {Math.round(experienceRating ?? 0)}
                        </div>
                        <div className="text-[10px] text-gray-400 mt-0.5">
                          {expLevelLabels[Math.min(expLevelLabels.length - 1, Math.floor((experienceRating ?? 0) / 20))]}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 性能评分卡片 */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[300px]">
                    <div className="text-sm text-gray-900 font-semibold mb-2">
                      <TitleWithTooltip title="性能评分" />
                    </div>
                    <div className="text-center mb-3">
                      <div className="text-3xl font-extrabold text-gray-900 leading-none">
                        {Math.round(performanceRating ?? 0)}
                        <span className="text-lg text-gray-400">/100</span>
                      </div>
                      <div className="mt-2">
                        <ProgressSegmentBar value={performanceRating ?? 0} labels={perfLevelLabels} labelsOnTop />
                      </div>
                    </div>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="space-y-2">
                      <ItemBarInline label="自充能力" value={selfChargingCapability} max={40} />
                      <ItemBarInline label="输出能力" value={outputCapability} max={35} />
                      <ItemBarInline label="能量" value={energy} max={20} />
                    </div>
                  </div>

                  {/* 体验评分卡片 */}
                  <div className="rounded-2xl border border-gray-200 bg-white p-4 flex-shrink-0 snap-center w-[calc(100vw-2rem)] max-w-[300px]">
                    <div className="text-sm text-gray-900 font-semibold mb-2">
                      <TitleWithTooltip title="体验评分" />
                    </div>
                    <div className="text-center mb-3">
                      <div className="text-3xl font-extrabold text-gray-900 leading-none">
                        {Math.round(experienceRating ?? 0)}
                        <span className="text-lg text-gray-400">/100</span>
                      </div>
                      <div className="mt-2">
                        <ProgressSegmentBar value={experienceRating ?? 0} labels={expLevelLabels} labelsOnTop />
                      </div>
                    </div>
                    <div className="h-px bg-gray-200 my-2" />
                    <div className="space-y-2">
                      <ItemBarInline label="便携性" value={portability} max={40} />
                      <ItemBarInline label="充电协议" value={chargingProtocols} max={30} />
                      <ItemBarInline label="多接口使用" value={multiPortUsage} max={20} />
                    </div>
                  </div>
                  <div className="shrink-0 w-2" aria-hidden="true" />
                </div>
              </div>
            </div>
            {/* 优势 / 不足 */}
            {(advantages?.length || disadvantages?.length) && (
              <div className="space-y-6">
                {advantages?.length ? (
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-2">优势</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {advantages.map((item: string, i: number) => (
                        <li key={i} className="flex">
                          <span className="mr-2 text-gray-600">+</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {disadvantages?.length ? (
                  <div>
                    <h3 className="text-gray-900 font-semibold mb-2">不足</h3>
                    <ul className="space-y-2 text-sm text-gray-700">
                      {disadvantages.map((item: string, i: number) => (
                        <li key={i} className="flex">
                          <span className="mr-2 text-gray-600">-</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}

            {/* 相关评测卡片 */}
            <ReviewCards subProjects={chargeBaby.subProjects} modelName={productModel} />

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
            产品评分与内容基于测试人所在环境的客观测试与主观体验，仅供参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。测试人：{chargeBaby.detailData?.dataSource || 'xxx'}
          </div>

          {/* 页脚版本信息 */}
          <div className="mt-4 text-[11px] text-gray-400 flex justify-end">评测版本：V0.10</div>

          {/* ICP备案信息 */}
          <ICPBeian variant="detail-mobile" />
        </div>
      </div>

      {/* 桌面端：分栏布局（左侧固定，右侧可滚动） */}
      <div className="hidden lg:block h-screen">
        <div className="container py-6 relative h-full flex flex-col">
          {/* 顶部操作栏 */}
          <div className="flex items-center justify-between mb-6 flex-shrink-0" data-ignore-capture="true">
            <Link href={backHref} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
              <span>返回</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href={`/compare?product=${encodeURIComponent(productModel)}&from=detail`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <GitCompare className="w-5 h-5" />
                <span>对比</span>
              </Link>
              <ShareButton
                title={`${title} - 充电宝测评`}
                text={`${title}
🔋 综合评分：${Math.round(overallRating ?? 0)}/100分
⚡ 性能评分：${Math.round(performanceRating ?? 0)}/100分
📱 体验评分：${Math.round(experienceRating ?? 0)}/100分
${priceText ? `💰 官方定价：${priceText}` : ''}

📊 详细测评数据和对比`}
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
                    <Battery className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>

              {/* 优势 / 不足 */}
              {(advantages?.length || disadvantages?.length) && (
                <div className="mt-8 space-y-6 flex-shrink-0">
                  {advantages?.length ? (
                    <div>
                      <h3 className="text-gray-900 font-semibold mb-2">优势</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {advantages.map((item: string, i: number) => (
                          <li key={i} className="flex">
                            <span className="mr-2 text-gray-600">+</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {disadvantages?.length ? (
                    <div>
                      <h3 className="text-gray-900 font-semibold mb-2">不足</h3>
                      <ul className="space-y-2 text-sm text-gray-700">
                        {disadvantages.map((item: string, i: number) => (
                          <li key={i} className="flex">
                            <span className="mr-2 text-gray-600">-</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              )}

              {/* 购买链接按钮 */}
              <div className="mt-8 flex-shrink-0">
                <div className="ml-0">
                  <PurchaseLinks chargeBaby={chargeBaby} variant="desktop" />
                </div>
              </div>
            </div>

            {/* 右侧：标题 + 评分数据 + 图文（可滚动） */}
            <div className="overflow-y-auto auto-hide-scrollbar">
              <div className="space-y-8 pr-4">
                {/* 标题与标签 */}
                <div>
                  {(brand || productModel) && (
                    <div className="text-base text-gray-600 mb-1">{brand ? `${brand} ${productModel}` : productModel}</div>
                  )}
                  <h1 className="text-4xl font-extrabold text-gray-900 leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <div className="text-lg text-gray-600 mt-1">{subtitle}</div>
                  )}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {Array.isArray(tags) && tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="px-3 py-1 rounded-md text-sm bg-gray-100 text-gray-700 border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                  {(priceText || releaseMonthText) && (
                    <div className="mt-2 text-sm text-gray-700">
                      <div>
                        <span>官方定价 </span>
                        {priceText && <span className="font-extrabold text-gray-900">{priceText}</span>}
                      </div>
                      {releaseMonthText && (
                        <div className="mt-1 text-xs text-gray-500">{releaseMonthText}</div>
                      )}
                    </div>
                  )}
                </div>

                {/* 综合评分 */}
                <div>
                  <div className="text-gray-900 font-semibold">
                    <TitleWithTooltip title="综合评分" />
                  </div>
                  <div className="mt-2 flex items-baseline gap-2">
                    <div className="text-5xl font-extrabold tracking-tight text-gray-900">
                      {Math.round(overallRating ?? 0)}
                    </div>
                    <div className="text-2xl text-gray-400">/100</div>
                  </div>
                  <div className="mt-3">
                    <ProgressSegmentBar value={overallRating ?? 0} labels={gradeLabels} labelsOnTop />
                  </div>
                </div>

                {/* 性能评分卡片 */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-xl text-gray-900 font-semibold mb-2">
                    <TitleWithTooltip title="性能评分" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="shrink-0">
                      <div className="text-6xl font-extrabold text-gray-900 leading-none">
                        {Math.round(performanceRating ?? 0)}
                        <span className="text-2xl text-gray-400">/100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <ProgressSegmentBar value={performanceRating ?? 0} labels={perfLevelLabels} className="mb-4" labelsOnTop />
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-3" />

                  <div className="mt-1 flex items-stretch gap-0">
                    <div className="flex-1 pr-4">
                      <ItemBarInline label="自充能力" value={selfChargingCapability} max={40} />
                    </div>
                    <div className="w-px bg-gray-200 self-center h-14" />
                    <div className="flex-1 px-4">
                      <ItemBarInline label="输出能力" value={outputCapability} max={35} />
                    </div>
                    <div className="w-px bg-gray-200 self-center h-14" />
                    <div className="flex-1 pl-4">
                      <ItemBarInline label="能量" value={energy} max={20} />
                    </div>
                  </div>
                </div>

                {/* 体验评分卡片 */}
                <div className="rounded-2xl border border-gray-200 bg-white p-5">
                  <div className="text-xl text-gray-900 font-semibold mb-2">
                    <TitleWithTooltip title="体验评分" />
                  </div>
                  <div className="flex items-start gap-6">
                    <div className="shrink-0">
                      <div className="text-6xl font-extrabold text-gray-900 leading-none">
                        {Math.round(experienceRating ?? 0)}
                        <span className="text-2xl text-gray-400">/100</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <ProgressSegmentBar value={experienceRating ?? 0} labels={expLevelLabels} className="mb-4" labelsOnTop />
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-3" />

                  <div className="mt-1 flex items-stretch gap-0">
                    <div className="flex-1 pr-4">
                      <ItemBarInline label="便携性" value={portability} max={40} />
                    </div>
                    <div className="w-px bg-gray-200 self-center h-14" />
                    <div className="flex-1 px-4">
                      <ItemBarInline label="充电协议" value={chargingProtocols} max={30} />
                    </div>
                    <div className="w-px bg-gray-200 self-center h-14" />
                    <div className="flex-1 pl-4">
                      <ItemBarInline label="多接口使用" value={multiPortUsage} max={20} />
                    </div>
                  </div>
                </div>

                {/* 详细数据透视预览卡片 */}
                {chargeBaby.detailData && (
                  <div className="h-80">
                    <DetailDataPreviewCard 
                      chargeBaby={chargeBaby} 
                      productModel={productModel}
                      variant="desktop"
                    />
                  </div>
                )}

                {/* 相关评测卡片 */}
                <ReviewCards subProjects={chargeBaby.subProjects} modelName={productModel} />

                {/* 图文内容 */}
                {articleContent && (
                  <div className="rounded-2xl border border-gray-200 bg-white p-5">
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">图文内容</h3>
                    <MarkdownRenderer content={articleContent} />
                  </div>
                )}

                {/* 免责声明 */}
                <div className="text-[11px] leading-5 text-gray-400 border-t border-gray-200 pt-6">
                  产品评分与内容基于测试人所在环境的客观测试与主观体验，仅供参考。实际使用效果可能因环境、设备、使用方式等因素产生差异，请以实际体验为准。测试人：{chargeBaby.detailData?.dataSource || 'xxx'}
                </div>

                {/* 页脚版本信息 */}
                <div className="text-[11px] text-gray-400 flex justify-end">评测版本：V0.10</div>

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

function ItemBar({ label, value = 0, max }: { label: string; value?: number; max: number }) {
  const width = `${getRatingProgress(value, max)}%`;
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm text-gray-700">
        <span>{label}</span>
        <span className="font-semibold">
          {formatRating(value)}/{max}
        </span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gray-700" style={{ width }} />
      </div>
    </div>
  );
}

function ProgressSegmentBar({ value = 0, labels, className = '', labelsOnTop = false, showBoundaries = false, showHalo = false }: { value?: number; labels: string[]; className?: string; labelsOnTop?: boolean; showBoundaries?: boolean; showHalo?: boolean }) {
  const count = labels.length;
  const clamped = Math.max(0, Math.min(100, value));
  const active = Math.min(count - 1, Math.floor(clamped / (100 / count)));
  const fillWidth = `${clamped}%`;
  const segWidth = 100 / count;
  const activeLeft = `${active * segWidth}%`;
  const activeWidth = `${segWidth}%`;
  return (
    <div className={className}>
      {labelsOnTop && (
        <div className="mb-1.5 flex justify-between text-[10px] sm:text-[11px] text-gray-400">
          {labels.map((l, i) => (
            <span key={l} className={i === active ? 'text-gray-700 font-semibold' : undefined}>
              {l}
            </span>
          ))}
        </div>
      )}
      <div className="relative h-3 w-full rounded-full bg-gray-200 overflow-hidden">
        {/* optional active segment halo */}
        {showHalo && (
          <div
            className="absolute inset-y-0 rounded-full ring-1 ring-gray-400/70"
            style={{ left: activeLeft, width: activeWidth }}
          />
        )}
        {/* optional segment boundaries */}
        {showBoundaries &&
          Array.from({ length: count - 1 }).map((_, i) => (
            <div key={i} className="absolute top-0 bottom-0 w-px bg-gray-300/80" style={{ left: `${((i + 1) * 100) / count}%` }} />
          ))}
        {/* fill */}
        <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-gray-700 via-gray-700 to-gray-500" style={{ width: fillWidth }} />
      </div>
      {!labelsOnTop && (
        <div className="mt-2 flex justify-between text-[11px] text-gray-500">
          {labels.map((l, i) => (
            <span key={l} className={i === active ? 'text-gray-900 font-semibold' : undefined}>
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemBarInline({ label, value = 0, max }: { label: string; value?: number; max: number }) {
  const width = `${getRatingProgress(value, max)}%`;
  return (
    <div className="w-full">
      <div className="text-sm text-gray-700">
        <TitleWithTooltip title={label} />
      </div>
      <div className="mt-1 text-lg md:text-xl font-bold text-gray-900 leading-none">
        {formatRating(value)}/{max}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gray-700" style={{ width }} />
      </div>
    </div>
  );
}

// 圆环评分组件
function CircularRating({
  value = 0,
  size = 120,
  showValue = true,
  centerContent,
}: {
  value?: number;
  size?: number;
  showValue?: boolean;
  centerContent?: ReactNode;
}) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clampedValue / 100) * circumference;
  
  // 使用灰色系，与其他卡片保持一致
  const color = '#374151'; // gray-700
  
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* 背景圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="none"
        />
        {/* 进度圆环 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      {centerContent ? (
        <div className="absolute inset-0 flex items-center justify-center text-center">{centerContent}</div>
      ) : (
        showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-3xl font-extrabold text-gray-900 leading-none">
              {Math.round(clampedValue)}
            </div>
            <div className="text-xs text-gray-500 mt-1">/ 100</div>
          </div>
        )
      )}
    </div>
  );
}
