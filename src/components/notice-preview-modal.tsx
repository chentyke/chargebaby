'use client';

import { useEffect } from 'react';
import { Calendar, User, Megaphone, Bell } from 'lucide-react';
import { Notice } from '@/types/chargebaby';
import { NOTICE_CATEGORY_COLORS, NOTICE_CATEGORY_LABELS } from '@/types/chargebaby';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface NoticePreviewModalProps {
  notice: Notice | null;
  isOpen: boolean;
  onClose: () => void;
}

export function NoticePreviewModal({ notice, isOpen, onClose }: NoticePreviewModalProps) {
  // 处理 ESC 键关闭弹窗
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 处理背景点击关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getCategoryIcon = (category: Notice['category']) => {
    return category === '公告' ? (
      <Megaphone className="w-5 h-5" />
    ) : (
      <Bell className="w-5 h-5" />
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!notice || !isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div className="relative bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">

        {/* 头部信息 */}
        <div className="p-4 sm:p-6 border-b border-gray-200 bg-white">
          <div className="flex items-start gap-3">
            {/* 类别图标 */}
            <div className={`flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${NOTICE_CATEGORY_COLORS[notice.category]}`}>
              {getCategoryIcon(notice.category)}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                {notice.title}
              </h2>

              <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{formatDate(notice.publishDate)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span>{notice.publisher}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white">
          {notice.content ? (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  // 自定义标题样式
                  h1: ({ children }) => (
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 mt-4 sm:mt-6 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3 mt-3 sm:mt-5 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2 mt-3 sm:mt-4 first:mt-0">
                      {children}
                    </h3>
                  ),
                  // 自定义段落样式
                  p: ({ children }) => (
                    <p className="text-gray-700 mb-3 sm:mb-4 leading-relaxed text-sm sm:text-base">
                      {children}
                    </p>
                  ),
                  // 自定义列表样式
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-gray-700 text-sm sm:text-base">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside space-y-1.5 sm:space-y-2 mb-3 sm:mb-4 text-gray-700 text-sm sm:text-base">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">
                      {children}
                    </li>
                  ),
                  // 自定义引用样式
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gray-300 pl-3 sm:pl-4 py-2 my-3 sm:my-4 bg-gray-50">
                      <p className="text-gray-700 italic text-sm sm:text-base">{children}</p>
                    </blockquote>
                  ),
                  // 自定义代码样式
                  code: (props: any) => {
                    const { inline, children } = props;
                    if (inline) {
                      return (
                        <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs sm:text-sm font-mono">
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="block bg-gray-900 text-gray-100 p-3 sm:p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono">
                        {children}
                      </code>
                    );
                  },
                  // 自定义链接样式
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline transition-colors text-sm sm:text-base"
                    >
                      {children}
                    </a>
                  ),
                  // 自定义分隔线样式
                  hr: () => (
                    <hr className="border-gray-200 my-4 sm:my-6" />
                  ),
                  // 自定义表格样式
                  table: ({ children }) => (
                    <div className="overflow-x-auto my-3 sm:my-4">
                      <table className="min-w-full border border-gray-200 rounded-lg text-sm sm:text-base">
                        {children}
                      </table>
                    </div>
                  ),
                  thead: ({ children }) => (
                    <thead className="bg-gray-50">
                      {children}
                    </thead>
                  ),
                  tbody: ({ children }) => (
                    <tbody className="divide-y divide-gray-200">
                      {children}
                    </tbody>
                  ),
                  th: ({ children }) => (
                    <th className="px-3 sm:px-4 py-2 text-left text-sm sm:text-base font-medium text-gray-900">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700">
                      {children}
                    </td>
                  ),
                }}
              >
                {notice.content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500">
              <p className="text-sm sm:text-base">暂无详细内容</p>
            </div>
          )}
        </div>

        {/* 底部操作区 */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}