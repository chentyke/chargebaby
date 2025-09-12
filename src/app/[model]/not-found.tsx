import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl text-gray-400">📱</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">产品未找到</h1>
          <p className="text-gray-600">
            抱歉，我们找不到您要查看的充电宝产品。
          </p>
        </div>
        
        <div className="space-y-3">
          <Link 
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}