import { Metadata } from 'next';
import { FeedbackForm } from '@/components/feedback-form';

export const metadata: Metadata = {
  title: '用户反馈 - ChargeBaby充电宝评测',
  description: '向我们提交您的宝贵建议和反馈，帮助我们改进产品体验',
  keywords: ['反馈', '建议', '意见', '充电宝', 'ChargeBaby'],
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <FeedbackForm />
    </div>
  );
}