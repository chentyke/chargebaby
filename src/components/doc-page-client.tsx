'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Book, Clock, Tags } from 'lucide-react';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { DocBreadcrumb } from '@/components/doc-breadcrumb';
import { DocNavigation } from '@/components/doc-navigation';
import { DocPage } from '@/lib/notion';
import '../app/docs/doc-styles.css';


interface DocPageClientProps {
  doc: DocPage;
  docs: DocPage[];
  breadcrumb: DocPage[];
  adjacent: { prev: DocPage | null; next: DocPage | null };
  path: string;
}

// 格式化日期函数
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '未知时间';
    }

    // 使用中文格式化日期
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Shanghai'
    };

    return date.toLocaleString('zh-CN', options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '未知时间';
  }
}

// Gitbook风格的侧边栏组件
function GitbookSidebar({ docs, currentPath, isOpen, onClose }: {
  docs: DocPage[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(() => {
    // 初始化时自动展开包含当前页面的项目
    const initialExpanded = new Set<string>();
    const normalizePath = (path: string) => {
      if (path.startsWith('/docs/')) return path;
      return path === '/' ? '/docs' : `/docs${path}`;
    };

    const currentPathNormalized = normalizePath(currentPath);

    const expandToCurrent = (items: DocPage[]) => {
      items.forEach(item => {
        const itemPathNormalized = normalizePath(item.path);
        const hasActiveChild = item.children.some(child =>
          currentPathNormalized === normalizePath(child.path) ||
          currentPathNormalized.startsWith(normalizePath(child.path)) ||
          child.children.some(subChild => currentPathNormalized.startsWith(normalizePath(subChild.path)))
        );

        if (hasActiveChild || currentPathNormalized === itemPathNormalized) {
          initialExpanded.add(item.id);
          expandToCurrent(item.children);
        }
      });
    };

    expandToCurrent(docs);
    return initialExpanded;
  });

  const normalizePath = (path: string) => {
    if (path.startsWith('/docs/')) return path;
    return path === '/' ? '/docs' : `/docs${path}`;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const renderNavItems = (items: DocPage[], level = 0) => {
    return items.map(item => {
      const isActive = normalizePath(currentPath) === normalizePath(item.path);
      const hasChildren = item.children && item.children.length > 0;
      const isExpanded = expandedItems.has(item.id);

      return (
        <div key={item.id} className="flex flex-col">
          <div className="group/toclink toclink relative transition-colors flex flex-row justify-between p-1.5 pl-3 text-balance font-normal text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-md">
            <Link
              href={normalizePath(item.path)}
              className={`flex items-center gap-3 flex-1 ${isActive ? 'font-semibold text-blue-600' : ''}`}
              onClick={() => {
                if (window.innerWidth < 1024) {
                  onClose();
                }
              }}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="truncate">{item.title}</span>
            </Link>
            {hasChildren && (
              <button
                className="group relative rounded-sm w-5 h-5 hover:bg-gray-200 text-gray-400 transition-colors flex items-center justify-center"
                onClick={() => toggleExpand(item.id)}
              >
                <span
                  className={`w-0 h-0 border-l-[4px] border-l-current border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            )}
          </div>
          {hasChildren && isExpanded && (
            <div className="ml-5 my-2 border-l border-gray-200 pl-2">
              {renderNavItems(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <aside className={`gitbook-sidebar ${isOpen ? 'mobile-open' : ''}`}>
      <div className="gitbook-sidebar-header">
        <div className="flex items-center gap-2">
          <Book className="w-6 h-6 text-blue-600" />
          <span className="font-semibold text-gray-900">文档中心</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md hover:bg-gray-100 lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="gitbook-sidebar-content">
        <nav className="flex flex-col gap-y-0.5">
          {renderNavItems(docs)}
        </nav>
      </div>

      <div className="gitbook-sidebar-footer">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-2"
        >
          <Home className="w-3 h-3" />
          <span>返回首页</span>
        </Link>
        <p>ChargeDB 文档</p>
      </div>
    </aside>
  );
}

export function DocPageClient({ doc, docs, breadcrumb, adjacent, path }: DocPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 移动端页眉 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Book className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-gray-900">文档</span>
          </div>
          <div className="w-10" />
        </div>
      </header>

      {/* 移动端覆盖层 */}
      {isSidebarOpen && (
        <div
          className="gitbook-mobile-overlay active"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Gitbook风格侧边栏 */}
      <GitbookSidebar
        docs={docs}
        currentPath={path}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* 主内容区 */}
      <main className="gitbook-main-content">
        <div className="gitbook-content-wrapper">
          {/* 面包屑导航 */}
          <div className="mb-6 lg:mb-6 pt-16 lg:pt-0">
            <DocBreadcrumb breadcrumb={breadcrumb} />
          </div>

          <div className="doc-layout">
            <article id="doc-article-start" className="doc-article">
              {/* 文档头部 */}
              <header className="doc-article-header space-y-3">
                <div className="flex items-center gap-4">
                  {doc.icon && (
                    <div className="text-4xl flex-shrink-0 text-gray-400">{doc.icon}</div>
                  )}
                  <h1 className="text-4xl font-bold flex items-center gap-4 grow text-pretty clear-right">
                    {doc.title}
                  </h1>
                </div>
                {doc.description && (
                  <p className="text-lg text-gray-600 clear-both">{doc.description}</p>
                )}

                {/* 元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>更新于 {formatDate(doc.updatedAt)}</span>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Tags className="w-4 h-4" />
                      <div className="flex flex-wrap gap-1">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </header>

              {/* 文档内容 */}
              <section className="doc-article-body">
                <div className="prose prose-lg max-w-none markdown-content">
                  <MarkdownRenderer content={doc.content} />
                </div>
              </section>

              {/* 文档导航 */}
              {(adjacent.prev || adjacent.next) && (
                <footer className="doc-article-footer">
                  <DocNavigation prev={adjacent.prev} next={adjacent.next} />
                </footer>
              )}
            </article>
          </div>

        </div>
      </main>
    </div>
  );
}
