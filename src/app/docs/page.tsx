import { Metadata } from 'next';
import Link from 'next/link';
import { getDocs } from '@/lib/notion';
import { Suspense } from 'react';
import './doc-styles.css';

export const metadata: Metadata = {
  title: '文档中心 | ChargeDB',
  description: 'ChargeDB 数据库文档中心，包含详细的使用指南、API参考和最佳实践。',
};

async function DocsHomePage() {
  const docs = await getDocs();

  // 获取所有根级文档
  const rootDocs = docs;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 页面头部 */}
        <header className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-4 sm:mb-6">
            <div className="text-4xl sm:text-5xl lg:text-6xl">📚</div>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            ChargeDB 文档中心
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto px-4">
            探索我们的测试流程，数据库结构及更多详细信息。
          </p>
        </header>

        {/* 文档分类 */}
        {rootDocs.length === 0 ? (
          <div className="text-center py-12 sm:py-16 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="text-4xl sm:text-5xl lg:text-6xl mb-4">📭</div>
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">暂无文档</h2>
            <p className="text-gray-600 px-4">文档正在整理中，请稍后查看。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {rootDocs.map((doc) => (
              <DocCategoryCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface DocCategoryCardProps {
  doc: any;
}

function DocCategoryCard({ doc }: DocCategoryCardProps) {
  // 计算子文档数量
  const countAllDocs = (docs: any[]): number => {
    return docs.reduce((count, doc) => {
      return count + 1 + countAllDocs(doc.children || []);
    }, 0);
  };

  const childCount = countAllDocs(doc.children);

  // 确保路径正确格式化
  const getPath = (path: string) => {
    if (!path) return '/docs';
    if (path.startsWith('/')) return `/docs${path}`;
    return `/docs/${path}`;
  };

  // 格式化日期函数
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '未知时间';
      }

      // 使用中文格式化日期（只显示日期部分）
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'Asia/Shanghai'
      };

      return date.toLocaleDateString('zh-CN', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '未知时间';
    }
  };

  return (
    <Link
      href={getPath(doc.path)}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-md hover:border-blue-300 transition-all duration-200 group h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <span className="text-2xl sm:text-3xl">{doc.icon}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full whitespace-nowrap">
          {childCount} 篇文档
        </span>
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
        {doc.title}
      </h3>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
        {doc.description}
      </p>
      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {doc.tags.slice(0, 3).map((tag: string) => (
            <span
              key={tag}
              className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
            >
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
              +{doc.tags.length - 3}
            </span>
          )}
        </div>
      )}

      {/* 最后修改时间 */}
      <div className="flex items-center gap-1 text-xs text-gray-500 mt-auto">
        <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="truncate">更新于 {formatDate(doc.updatedAt)}</span>
      </div>
    </Link>
  );
}


export default function DocsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <DocsHomePage />
    </Suspense>
  );
}