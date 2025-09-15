import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { TestTube, Eye, FileText, Users } from 'lucide-react';

export const metadata = {
  title: '产品投稿 - ChargeBaby',
  description: '提交充电宝产品信息或申请测试，帮助完善我们的数据库',
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
            分享你的充电宝测试数据或申请产品测试
          </p>
        </div>

        {/* 投稿选项 */}
        <div className="max-w-4xl mx-auto space-y-4 mb-8">
          {/* 选项1: 我拥有此产品并进行测试 */}
          <Link href="https://docs.qq.com/form/page/DT1ZzRXZyZEZRTFJU" target="_blank" rel="noopener noreferrer">
            <div className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <TestTube className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">我拥有此产品并进行测试</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    分享测试数据和使用体验
                  </p>
                  <div className="inline-flex items-center gap-1 text-blue-600 text-xs font-medium mt-2 group-hover:text-blue-700">
                    <FileText className="w-3 h-3" />
                    填写测试数据表单
                  </div>
                </div>
              </div>
            </div>
          </Link>

          {/* 选项2: 我想看此产品的数据 */}
          <Link href="/wishlist">
            <div className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer active:scale-[0.98]">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                  <Eye className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">我想看此产品的数据</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    申请测试感兴趣的充电宝产品
                  </p>
                  <div className="inline-flex items-center gap-1 text-purple-600 text-xs font-medium mt-2 group-hover:text-purple-700">
                    <Users className="w-3 h-3" />
                    查看待测排行榜
                  </div>
                </div>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}