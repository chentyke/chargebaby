import { Suspense } from 'react';
import { SubmissionForm } from '@/components/submission-form';
import { Loading } from '@/components/ui/loading';
import { BackButton } from '@/components/ui/back-button';

export const metadata = {
  title: '产品投稿 - ChargeBaby',
  description: '提交充电宝产品信息，帮助完善我们的数据库',
};

export default function SubmitPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      
      <div className="container py-6 sm:py-10 relative">
        {/* 返回按钮 */}
        <div className="mb-6">
          <BackButton href="/" variant="compact">
            返回首页
          </BackButton>
        </div>

        {/* 页面标题 */}
        <div className="text-center mb-10">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
            <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              产品投稿
            </span>
          </h1>
          <p className="text-lg text-gray-600/90 max-w-2xl mx-auto">
            分享你的充电宝测试数据，帮助更多用户做出更好的选择
          </p>
        </div>

        {/* 投稿表单 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden">
            <Suspense fallback={<Loading text="加载表单..." />}>
              <SubmissionForm />
            </Suspense>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="max-w-4xl mx-auto mt-8">
          <div className="bg-blue-50/50 backdrop-blur-sm rounded-2xl border border-blue-100/50 p-6">
            <h3 className="text-base font-semibold text-blue-900 mb-2">投稿须知</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 请确保提供的数据真实准确</li>
              <li>• 测试数据应基于实际测试环境</li>
              <li>• 图片请使用清晰的产品照片</li>
              <li>• 提交后我们会进行审核，通过后将显示在网站上</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}