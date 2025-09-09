import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Battery } from 'lucide-react';
import { getChargeBabyById } from '@/lib/notion';
import { formatPrice, formatRating, getRatingProgress, formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ChargeBabyDetailPage({ params }: PageProps) {
  const { id } = await params;
  const chargeBaby = await getChargeBabyById(id);

  if (!chargeBaby) {
    notFound();
  }

  const {
    model,
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10 items-start">
          {/* 左侧：大图 + 优劣势 */}
          <div>
            <div className="relative aspect-square overflow-hidden pl-0 pr-0 sm:pl-2 sm:pr-6 pt-2 pb-2 sm:pt-6 sm:pb-6 max-w-[320px] sm:max-w-none mx-auto sm:mx-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Battery className="w-24 h-24 text-gray-300" />
                </div>
              )}
            </div>

            {/* 移动端：标题与标签（放在图片后，整屏显示） */}
            <div className="mt-4 lg:hidden">
              {model && (
                <div className="text-sm sm:text-base text-gray-600 mb-1">{model}</div>
              )}
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <div className="text-base sm:text-lg text-gray-600 mt-1">{subtitle}</div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.isArray(tags) && tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-md text-xs sm:text-sm bg-gray-100 text-gray-700 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
              {(priceText || releaseMonthText) && (
                <div className="mt-2 text-xs sm:text-sm text-gray-700">
                  <span>官方定价 </span>
                  {priceText && <span className="font-extrabold text-gray-900">{priceText}</span>}
                  {releaseMonthText && <span className="ml-2 text-gray-600">{releaseMonthText}</span>}
                </div>
              )}
            </div>

            {/* 优势 / 不足 */}
            {(advantages?.length || disadvantages?.length) && (
              <div className="mt-10 space-y-6">
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

            {/* 免责声明区域（移动端放在页面底部，此处移除） */}
          </div>

          {/* 右侧：标题 + 评分卡片 */}
          <div className="space-y-8">
            {/* 桌面端：标题与标签（移动端隐藏） */}
            <div className="hidden lg:block">
              {model && (
                <div className="text-sm sm:text-base text-gray-600 mb-1">{model}</div>
              )}
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight">
                {title}
              </h1>
              {subtitle && (
                <div className="text-base sm:text-lg text-gray-600 mt-1">{subtitle}</div>
              )}
              <div className="flex flex-wrap gap-2 mt-3">
                {Array.isArray(tags) && tags.slice(0, 3).map((tag: string) => (
                  <span key={tag} className="px-3 py-1 rounded-md text-xs sm:text-sm bg-gray-100 text-gray-700 border border-gray-200">
                    {tag}
                  </span>
                ))}
              </div>
              {(priceText || releaseMonthText) && (
                <div className="mt-2 text-xs sm:text-sm text-gray-700">
                  <span>官方定价 </span>
                  {priceText && <span className="font-extrabold text-gray-900">{priceText}</span>}
                  {releaseMonthText && <span className="ml-2 text-gray-600">{releaseMonthText}</span>}
                </div>
              )}
            </div>

            {/* 综合评分 */}
            <div>
              <div className="text-gray-900 font-semibold">综合评分</div>
              <div className="mt-2 flex items-baseline gap-2">
                <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
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
              <div className="text-lg sm:text-xl text-gray-900 font-semibold mb-2">性能评分</div>
              <div className="flex items-start gap-6">
                <div className="shrink-0">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-none">
                    {Math.round(performanceRating ?? 0)}
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <ProgressSegmentBar value={performanceRating ?? 0} labels={perfLevelLabels} className="mb-4" labelsOnTop />
                </div>
              </div>
              <div className="h-px bg-gray-200 my-3" />

              <div className="mt-1 flex flex-col sm:flex-row sm:items-stretch gap-6 sm:gap-0">
                <div className="flex-1 sm:pr-4">
                  <ItemBarInline label="自充能力" value={selfChargingCapability} max={40} />
                </div>
                <div className="hidden sm:block w-px bg-gray-200 self-center h-14" />
                <div className="flex-1 sm:px-4">
                  <ItemBarInline label="输出能力" value={outputCapability} max={35} />
                </div>
                <div className="hidden sm:block w-px bg-gray-200 self-center h-14" />
                <div className="flex-1 sm:pl-4">
                  <ItemBarInline label="能量" value={energy} max={20} />
                </div>
              </div>
            </div>

            {/* 体验评分卡片 */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="text-lg sm:text-xl text-gray-900 font-semibold mb-2">体验评分</div>
              <div className="flex items-start gap-6">
                <div className="shrink-0">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-none">
                    {Math.round(experienceRating ?? 0)}
                    <span className="text-2xl text-gray-400">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <ProgressSegmentBar value={experienceRating ?? 0} labels={expLevelLabels} className="mb-4" labelsOnTop />
                </div>
              </div>
              <div className="h-px bg-gray-200 my-3" />

              <div className="mt-1 flex flex-col sm:flex-row sm:items-stretch gap-6 sm:gap-0">
                <div className="flex-1 sm:pr-4">
                  <ItemBarInline label="便携性" value={portability} max={40} />
                </div>
                <div className="hidden sm:block w-px bg-gray-200 self-center h-14" />
                <div className="flex-1 sm:px-4">
                  <ItemBarInline label="充电协议" value={chargingProtocols} max={30} />
                </div>
                <div className="hidden sm:block w-px bg-gray-200 self-center h-14" />
                <div className="flex-1 sm:pl-4">
                  <ItemBarInline label="多接口使用" value={multiPortUsage} max={20} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 免责声明（最后显示） */}
        <div className="mt-10 text-[11px] leading-5 text-gray-400">
          本页评分与内容基于实验室环境的客观测试与主观体验，仅供参考。不同使用场景及批次会存在差异，请以实际体验为准。
        </div>

        {/* 页脚版本信息 */}
        <div className="mt-4 text-[11px] text-gray-400 flex justify-end">评测版本：V0.10</div>
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
      <div className="text-sm text-gray-700">{label}</div>
      <div className="mt-1 text-lg md:text-xl font-bold text-gray-900 leading-none">
        {formatRating(value)}/{max}
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-gray-200 overflow-hidden">
        <div className="h-full bg-gray-700" style={{ width }} />
      </div>
    </div>
  );
}
