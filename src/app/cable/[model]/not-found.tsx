import Link from 'next/link';
import { Cable, ArrowLeft } from 'lucide-react';

export default function CableNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-100/50 flex items-center justify-center">
      <div className="container">
        <div className="text-center space-y-6 max-w-md mx-auto">
          {/* 图标 */}
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <Cable className="w-10 h-10 text-green-600" />
          </div>

          {/* 标题和描述 */}
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-900">充电线未找到</h1>
            <p className="text-gray-600">
              抱歉，您访问的充电线产品页面不存在。可能是产品已被下架或链接有误。
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="space-y-3">
            <Link
              href="/cable"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>返回充电线列表</span>
            </Link>

            <div className="text-sm">
              <Link
                href="/"
                className="text-green-600 hover:text-green-700 transition-colors"
              >
                返回首页
              </Link>
            </div>
          </div>

          {/* 建议链接 */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 mb-3">您可能想要：</p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Link
                href="/"
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                移动电源数据库
              </Link>
              <Link
                href="/ranking"
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                产品排行榜
              </Link>
              <Link
                href="/compare"
                className="text-sm px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
              >
                产品对比
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}