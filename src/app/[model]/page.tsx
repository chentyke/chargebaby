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
import { PurchaseLinks } from '@/components/purchase-links';
import { ShareButton } from '@/components/share-button';
import { DetailDataPreviewCard } from '@/components/detail-data-preview-card';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    model: string;
  }>;
  searchParams: Promise<{
    from?: string;
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
  const { from } = await searchParams;
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

  // 根据来源决定返回地址
  const backHref = from === 'ranking' ? '/ranking' : '/';

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

          <div id="capture-root" className="space-y-8">
            {/* 产品图片 */}
            <div className="relative aspect-square overflow-hidden max-w-[320px] mx-auto" data-detail-image>
              {imageUrl ? (
                <NotionImage
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-contain animate-fade-in"
                  sizes="320px"
                  priority
                  enableZoom
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center animate-fade-in">
                  <Battery className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* 标题与标签 */}
            <div className="text-center">
              {(brand || productModel) && (
                <div className="text-sm text-gray-600 mb-1">{brand ? `${brand} ${productModel}` : productModel}</div>
              )}
              <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <div className="text-base text-gray-600 mt-1">{subtitle}</div>
              )}
              <div className="flex flex-wrap gap-2 mt-3 justify-center">
                {Array.isArray(tags) && tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
              {(priceText || releaseMonthText) && (
                <div className="mt-3 text-sm text-gray-700">
                  <span>官方定价 </span>
                  {priceText && <span className="font-extrabold text-gray-900">{priceText}</span>}
                  {releaseMonthText && <span className="ml-2 text-gray-600">{releaseMonthText}</span>}
                </div>
              )}
            </div>

            {/* 综合评分 */}
            <div>
              <div className="text-gray-900 font-semibold text-center">
                <TitleWithTooltip title="综合评分" className="justify-center" />
              </div>
              <div className="mt-2 flex items-baseline gap-2 justify-center">
                <div className="text-4xl font-extrabold tracking-tight text-gray-900">
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
              <div className="text-lg text-gray-900 font-semibold mb-2">
                <TitleWithTooltip title="性能评分" />
              </div>
              <div className="text-center mb-4">
                <div className="text-4xl font-extrabold text-gray-900 leading-none">
                  {Math.round(performanceRating ?? 0)}
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="mt-3">
                  <ProgressSegmentBar value={performanceRating ?? 0} labels={perfLevelLabels} labelsOnTop />
                </div>
              </div>
              <div className="h-px bg-gray-200 my-3" />
              <div className="space-y-4">
                <ItemBarInline label="自充能力" value={selfChargingCapability} max={40} />
                <ItemBarInline label="输出能力" value={outputCapability} max={35} />
                <ItemBarInline label="能量" value={energy} max={20} />
              </div>
            </div>

            {/* 体验评分卡片 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-lg text-gray-900 font-semibold mb-2">
                <TitleWithTooltip title="体验评分" />
              </div>
              <div className="text-center mb-4">
                <div className="text-4xl font-extrabold text-gray-900 leading-none">
                  {Math.round(experienceRating ?? 0)}
                  <span className="text-2xl text-gray-400">/100</span>
                </div>
                <div className="mt-3">
                  <ProgressSegmentBar value={experienceRating ?? 0} labels={expLevelLabels} labelsOnTop />
                </div>
              </div>
              <div className="h-px bg-gray-200 my-3" />
              <div className="space-y-4">
                <ItemBarInline label="便携性" value={portability} max={40} />
                <ItemBarInline label="充电协议" value={chargingProtocols} max={30} />
                <ItemBarInline label="多接口使用" value={multiPortUsage} max={20} />
              </div>
            </div>

            {/* 详细数据透视预览卡片 - 移动端 */}
            {chargeBaby.detailData && (
              <div className="h-64">
                <DetailDataPreviewCard 
                  chargeBaby={chargeBaby} 
                  productModel={productModel}
                  variant="mobile"
                />
              </div>
            )}

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

            {/* 购买链接按钮 */}
            <div className="px-4">
              <div className="ml-0">
                <PurchaseLinks chargeBaby={chargeBaby} variant="mobile" />
              </div>
            </div>

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
                      <span>官方定价 </span>
                      {priceText && <span className="font-extrabold text-gray-900">{priceText}</span>}
                      {releaseMonthText && <span className="ml-2 text-gray-600">{releaseMonthText}</span>}
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