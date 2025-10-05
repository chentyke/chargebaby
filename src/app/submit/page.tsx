'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { ChargeBabySubmissionForm } from '@/components/chargebaby-submission-form';
import { CapWidget } from '@/components/cap-widget';
import { Eye, FileText, Users, Clock, AlertCircle } from 'lucide-react';

export default function SubmitPage() {
  const [currentView, setCurrentView] = useState<'home' | 'form'>('home');
  const [hasAgreed, setHasAgreed] = useState(false);
  const [capToken, setCapToken] = useState<string | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleStartSubmission = () => {
    if (hasAgreed && !showVerification) {
      setShowVerification(true);
    } else if (hasAgreed && capToken) {
      setCurrentView('form');
    }
  };

  const handleCapVerify = (token: string) => {
    setCapToken(token);
    setTimeout(() => {
      setCurrentView('form');
    }, 500);
  };

  const handleCapError = () => {
    setCapToken(null);
    alert('验证失败，请重试');
  };

  // 在服务端渲染期间显示加载状态，避免hydration不匹配
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 h-[140%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.6))]" />
        </div>

        <div className="relative">
          <div className="container py-6 sm:py-10">
            <div className="mx-auto max-w-3xl">
              <div className="rounded-[24px] border border-slate-200/60 bg-white/80 p-10 text-center shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] backdrop-blur-2xl">
                <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                </div>
                <p className="text-sm text-slate-600">正在加载...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-slate-50 relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-y-0 left-1/2 h-[140%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.25),_transparent_60%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.92),rgba(241,245,249,0.55))]" />
        </div>

        <div className="relative">
          <div className="container py-6 sm:py-10">
            <div className="mb-6">
              <BackButton onClick={() => setCurrentView('home')} variant="compact">
                返回选择页面
              </BackButton>
            </div>

            <div className="rounded-[28px] border border-slate-200/60 bg-white/90 shadow-[0_24px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur-2xl transition lg:p-10 p-6">
              <ChargeBabySubmissionForm />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const infoHighlights = [
    {
      title: '标准化实验流程',
      description: '覆盖容量、温升、协议识别等维度，帮助保持数据一致性。',
    },
    {
      title: '数据版权仍归属您',
      description: '我们仅在数据库中存储、展示与分析，并确保注明来源。',
    },
    {
      title: '典型填写用时 10-15 分钟',
      description: '建议先整理数据草稿，当前页面不提供自动保存功能。',
    },
  ];

  const supportOptions = [
    {
      href: 'https://docs.qq.com/form/page/DT1ZzRXZyZEZRTFJU',
      external: true,
      title: '使用腾讯表单提交',
      description: '继续沿用原有的文档收集方式。',
      icon: FileText,
      cta: '打开表单',
    },
    {
      href: '/wishlist',
      title: '申请关注的测试项目',
      description: '告诉我们哪些产品值得优先测评。',
      icon: Eye,
      cta: '查看待测列表',
      footnote: (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
          <Users className="h-3 w-3" />
          社区协作
        </span>
      ),
    },
    {
      href: '/feedback',
      title: '反馈网站问题或建议',
      description: '帮助我们改进体验与功能。',
      icon: AlertCircle,
      cta: '提交反馈',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 h-[140%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(165deg,rgba(255,255,255,0.95),rgba(248,250,252,0.45))]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(226,232,240,0.35),_transparent_60%)]" />
      </div>

      <div className="relative">
        <div className="container py-6 sm:py-10">
          <div className="mb-6 flex items-center gap-3">
            <BackButton href="/" variant="compact">
              返回首页
            </BackButton>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.35fr,1fr] xl:gap-14">
            <section className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/90 shadow-[0_28px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur-2xl transition">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-slate-100 via-slate-50 to-transparent opacity-70 blur-3xl" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.08),_transparent_65%)]" />

              <div className="p-6 sm:p-10">
                <div className="space-y-8">
                  <div className="space-y-6 text-left">
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50/70 px-4 py-1.5 text-xs font-medium text-slate-600">
                      充电宝测试投稿入口
                    </div>
                    <div className="space-y-4">
                      <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
                        提交您的实测数据
                      </h1>
                      <p className="text-base text-slate-600 sm:text-lg">
                        汇总您对移动电源的测试结果，帮助我们完善数据库并为更多玩家提供可信赖的参考信息。
                      </p>
                    </div>
                    <dl className="grid gap-4 rounded-2xl border border-slate-200/70 bg-slate-50/80 p-5 sm:grid-cols-3 sm:gap-5">
                      {infoHighlights.map(({ title, description }, index) => (
                        <div
                          key={title}
                          className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/85 px-5 py-6 shadow-[0_26px_70px_-36px_rgba(15,23,42,0.6)] transition duration-500 ease-[cubic-bezier(0.21,1.02,0.73,1)] hover:-translate-y-1"
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_70%)] opacity-80" />
                          <div className="relative space-y-3">
                            <span className="text-xs font-medium tracking-[0.4em] text-slate-400/90">
                              {`0${index + 1}`}
                            </span>
                            <dt className="text-sm font-semibold text-slate-800">{title}</dt>
                            <dd className="text-xs leading-relaxed text-slate-500/90">{description}</dd>
                          </div>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="space-y-6 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-[0_20px_50px_-25px_rgba(15,23,42,0.28)]">
                    <div className="space-y-2">
                      <h2 className="text-lg font-medium text-slate-800">开始前请确认</h2>
                      <p className="text-sm leading-relaxed text-slate-600">
                        以下事项有助于确保资料完整且便于收录，建议在正式填写前逐项检查。
                      </p>
                    </div>

                    <div className="space-y-5">
                      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50/70 to-white px-6 py-6 text-slate-800 shadow-[0_24px_60px_-35px_rgba(15,23,42,0.4)]">
                        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.2),_transparent_65%)]" />
                        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">测评必读</p>
                            <h3 className="text-lg font-semibold text-slate-900">移动电源测试指南</h3>
                            <p className="text-xs leading-relaxed text-slate-600">
                              覆盖容量校准、效率、温升与协议识别等关键步骤，请先核对您的实验流程与记录格式。
                            </p>
                          </div>
                          <Link
                            href="/docs/powerbank101"
                            target="_blank"
                            className="inline-flex items-center gap-2 rounded-full border border-slate-900/10 bg-slate-900 px-5 py-2 text-xs font-medium text-white transition hover:bg-slate-800"
                          >
                            查看指南
                            <span aria-hidden>→</span>
                          </Link>
                        </div>
                      </div>

                      <div className="flex gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-600">
                          <Clock className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium text-slate-700">整理原始记录</p>
                          <p className="text-xs leading-relaxed text-slate-500">
                            在填写前预先备份关键数据表格或截图；当前页面暂无草稿功能，录入时请一次性完成。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5">
                      <label className="flex items-start gap-3 text-left">
                        <input
                          type="checkbox"
                          checked={hasAgreed}
                          onChange={(e) => setHasAgreed(e.target.checked)}
                          className="mt-1.5 h-4 w-4 rounded border-slate-300 text-slate-700 focus:ring-slate-500"
                        />
                        <span className="text-xs leading-relaxed text-slate-600">
                          您的测试数据仍归属于您本人。提交即表示授权本站长期存储、展示与分析，我们会在引用时标注来源并保护您的个人信息。
                        </span>
                      </label>
                    </div>
                  </div>

                  {showVerification && (
                    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 p-6 shadow-[0_16px_45px_-30px_rgba(15,23,42,0.45)] transition-all duration-500 ease-[cubic-bezier(0.21,1.02,0.73,1)]">
                      <div className="mb-4 text-center">
                        <h3 className="text-base font-medium text-slate-800">安全验证</h3>
                        <p className="text-xs text-slate-500">完成验证后即可开启数据填写</p>
                      </div>
                      <div className="flex justify-center">
                        <CapWidget onVerify={handleCapVerify} onError={handleCapError} />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                    <button
                      onClick={handleStartSubmission}
                      disabled={!hasAgreed || (showVerification && !capToken)}
                      className={`inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium tracking-wide transition duration-500 ease-[cubic-bezier(0.21,1.02,0.73,1)] ${
                        hasAgreed && (!showVerification || capToken)
                          ? 'bg-slate-900 text-white shadow-[0_20px_40px_-28px_rgba(15,23,42,0.8)] hover:-translate-y-0.5 hover:bg-slate-900/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400'
                          : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {showVerification && !capToken ? '请先完成验证' : '开始提交数据'}
                    </button>
                    {!showVerification && (
                      <button
                        onClick={() => setShowVerification(true)}
                        className="text-xs font-medium text-slate-500 underline-offset-4 transition hover:text-slate-800 hover:underline"
                      >
                        需要验证码？点击开启验证流程
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <aside className="flex flex-col gap-6">
              <div className="relative overflow-hidden rounded-[28px] border border-slate-200/60 bg-white/90 p-6 shadow-[0_24px_60px_-30px_rgba(15,23,42,0.4)] backdrop-blur-2xl">
                <div className="pointer-events-none absolute -top-6 right-6 h-20 w-20 rounded-full bg-gradient-to-br from-white via-slate-50 to-transparent opacity-70 blur-2xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-[radial-gradient(circle_at_bottom,_rgba(15,23,42,0.07),_transparent_60%)]" />

                <div className="space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs font-medium tracking-[0.28em] text-slate-400">投稿须知</p>
                    <h2 className="text-xl font-semibold text-slate-900">提交说明</h2>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-600">
                    合理安排时间与记录方式，保持数据清晰完整，方便后续整理与比对。填写过程中可随时暂存于本地草稿，最终一次性提交。
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {supportOptions.map(({ href, external, title, description, icon: Icon, cta, footnote }) => (
                  <Link
                    key={title}
                    href={href}
                    target={external ? '_blank' : undefined}
                    rel={external ? 'noopener noreferrer' : undefined}
                    className="group relative overflow-hidden rounded-[24px] border border-slate-200/70 bg-white/85 p-6 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] transition duration-500 ease-[cubic-bezier(0.21,1.02,0.73,1)] hover:-translate-y-1"
                  >
                    <div className="pointer-events-none absolute -right-10 top-3 h-24 w-24 rounded-full bg-[radial-gradient(circle,_rgba(148,163,184,0.15),_transparent_65%)] transition duration-500 group-hover:scale-125" />
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-600 shadow-inner">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                          <p className="text-sm leading-relaxed text-slate-600">{description}</p>
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span className="inline-flex items-center gap-1 transition group-hover:text-slate-800">
                            {cta}
                            <span aria-hidden>→</span>
                          </span>
                          {footnote}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
