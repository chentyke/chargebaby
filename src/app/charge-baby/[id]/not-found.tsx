import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { BackButton } from '@/components/ui/back-button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
          <Search className="w-12 h-12 text-gray-400" />
        </div>
        
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            产品未找到
          </h1>
          <p className="text-gray-600">
            抱歉，您访问的充电宝产品不存在或已被移除。
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex justify-center">
            <BackButton href="/" variant="home" className="w-full justify-center">
              返回首页
            </BackButton>
          </div>
          
          <div className="flex justify-center">
            <BackButton href="/" className="btn btn-outline w-full justify-center">
              浏览所有产品
            </BackButton>
          </div>
        </div>

        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            如果您认为这是一个错误，请联系我们的技术支持团队。
          </p>
        </div>
      </div>
    </div>
  );
}



