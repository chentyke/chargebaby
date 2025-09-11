import Link from 'next/link';
import { Home, Search } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-8 max-w-lg mx-auto px-4">
        <div className="space-y-4">
          <div className="text-6xl font-bold text-gray-300">404</div>
          <h1 className="text-3xl font-bold text-gray-900">
            页面未找到
          </h1>
          <p className="text-xl text-gray-600">
            抱歉，您访问的页面不存在。
          </p>
        </div>

        <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto">
          <Search className="w-16 h-16 text-blue-500" />
        </div>

        <div className="space-y-4">
          <div className="flex justify-center">
            <BackButton href="/" variant="home">
              返回首页
            </BackButton>
          </div>
          
          <p className="text-sm text-gray-500">
            或者您可以尝试搜索您需要的充电宝产品
          </p>
        </div>
      </div>
    </div>
  );
}


