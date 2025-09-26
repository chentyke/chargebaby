import { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback-form';
import { BackButton } from '@/components/ui/back-button';

export const metadata: Metadata = {
  title: '用户反馈 - ChargeBaby充电宝评测',
  description: '向我们提交您的宝贵建议和反馈，帮助我们改进产品体验',
  keywords: ['反馈', '建议', '意见', '充电宝', 'ChargeBaby'],
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-slate-50 relative">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 h-[140%] w-[140%] -translate-x-1/2 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_transparent_70%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(170deg,rgba(255,255,255,0.96),rgba(241,245,249,0.5))]" />
      </div>

      <div className="relative">
        <div className="container py-6 sm:py-10">
          <BackButton href="/submit" variant="compact">
            返回投稿页面
          </BackButton>

          <div className="mt-8 flex justify-center">
            <FeedbackForm />
          </div>
        </div>
      </div>
    </div>
  );
}
