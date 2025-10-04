import Link from 'next/link';

export default function DocsNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="text-6xl mb-4">📭</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">文档未找到</h1>
        <p className="text-gray-600 mb-6">
          抱歉，您访问的文档不存在或已被移除。
        </p>
        <div className="space-y-3">
          <Link
            href="/docs"
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
          >
            返回文档首页
          </Link>
          <Link
            href="/"
            className="block w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-center"
          >
            返回网站首页
          </Link>
        </div>
      </div>
    </div>
  );
}