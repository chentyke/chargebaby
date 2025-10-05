'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X, Home, Book, Clock, Tags, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { MarkdownRenderer, HeadingInfo } from '@/components/markdown-renderer';
import { DocBreadcrumb } from '@/components/doc-breadcrumb';
import { DocNavigation } from '@/components/doc-navigation';
import { DocPage } from '@/lib/notion';
import '../app/docs/doc-styles.css';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';


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
function GitbookSidebar({
  docs,
  currentPath,
  isOpen,
  onClose,
  collapsed,
  onToggleCollapse,
  headings,
  activeHeadingId,
  onTocItemClick,
  mobileView,
  onMobileViewChange,
}: {
  docs: DocPage[];
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  headings: HeadingInfo[];
  activeHeadingId: string | null;
  onTocItemClick: (id: string) => void;
  mobileView: 'toc' | 'docs';
  onMobileViewChange: (view: 'toc' | 'docs') => void;
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

      if (collapsed && level > 0) {
        return null;
      }

      const containerClass = collapsed
        ? 'group/toclink toclink transition-colors flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-md text-lg'
        : 'group/toclink toclink relative transition-colors flex flex-row justify-between p-1.5 pl-3 text-balance font-normal text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800/60 dark:hover:text-slate-100 rounded-md';

      const linkClass = collapsed
        ? `flex items-center justify-center ${isActive ? 'text-blue-600 dark:text-blue-400' : 'dark:text-slate-200'}`
        : `flex items-center gap-3 flex-1 ${isActive ? 'font-semibold text-blue-600 dark:text-blue-400' : 'dark:text-slate-200'}`;

      return (
        <div key={item.id} className="flex flex-col">
          <div className={containerClass}>
            <Link
              href={normalizePath(item.path)}
              aria-label={item.title}
              className={linkClass}
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  onClose();
                }
              }}
            >
              {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
              <span className="toclink-label truncate">{item.title}</span>
            </Link>
            {hasChildren && !collapsed && (
              <button
                className="group relative rounded-md w-7 h-7 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 dark:text-slate-400 transition-colors flex items-center justify-center"
                onClick={() => toggleExpand(item.id)}
              >
                <span
                  className={`w-0 h-0 border-l-[7px] border-l-current border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent transition-transform ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>
            )}
          </div>
          {hasChildren && !collapsed && isExpanded && (
            <div className="ml-5 my-2 border-l border-gray-200 dark:border-slate-700 pl-2">
              {renderNavItems(item.children!, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  const docNavItems = renderNavItems(docs);

  return (
    <aside className={`gitbook-sidebar ${isOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="gitbook-sidebar-header">
        <div className={`flex items-center gap-2 overflow-hidden ${collapsed ? 'hidden' : ''}`}>
          <Book className="w-6 h-6 text-blue-600 flex-shrink-0" />
          <span className="font-semibold text-gray-900 dark:text-slate-100 truncate">文档中心</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex items-center justify-center rounded-md p-1.5 text-gray-400 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label={collapsed ? '展开侧边栏' : '收起侧边栏'}
          >
            {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 lg:hidden"
            aria-label="关闭侧边栏"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="gitbook-sidebar-content">
        <div className="gitbook-sidebar-mobile-tabs">
          <button
            type="button"
            className={cn(
              'sidebar-tab-button',
              mobileView === 'toc' && 'sidebar-tab-button-active'
            )}
            onClick={() => onMobileViewChange('toc')}
          >
            目录
          </button>
          <button
            type="button"
            className={cn(
              'sidebar-tab-button',
              mobileView === 'docs' && 'sidebar-tab-button-active'
            )}
            onClick={() => onMobileViewChange('docs')}
          >
            文档
          </button>
        </div>

        <div
          className={cn(
            'gitbook-sidebar-toc-panel',
            mobileView === 'toc' ? 'is-visible' : 'is-hidden'
          )}
        >
          <nav className="gitbook-sidebar-toc-list" aria-label="目录">
            {headings.map((heading) => (
              <button
                key={heading.id}
                type="button"
                className={cn(
                  'gitbook-sidebar-toc-item',
                  `gitbook-sidebar-toc-level-${heading.level}`,
                  heading.id === activeHeadingId && 'gitbook-sidebar-toc-item-active'
                )}
                onClick={() => {
                  onTocItemClick(heading.id);
                  onClose();
                }}
              >
                {heading.text}
              </button>
            ))}
            {headings.length === 0 && (
              <p className="gitbook-sidebar-toc-empty">该文档暂无目录</p>
            )}
          </nav>
        </div>

        <nav
          className={cn(
            'gitbook-sidebar-doc-list-mobile',
            mobileView === 'docs' ? 'is-visible' : 'is-hidden'
          )}
        >
          {docNavItems}
        </nav>
        <nav className="gitbook-sidebar-doc-list-desktop">
          {docNavItems}
        </nav>
      </div>

      <div className="gitbook-sidebar-footer">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors mb-2"
        >
          <Home className="w-3 h-3" />
          {!collapsed && <span className="sidebar-footer-text">返回首页</span>}
        </Link>
        {!collapsed && <p className="sidebar-footer-text">ChargeDB 文档</p>}
      </div>
    </aside>
  );
}

function DocTableOfContents({
  headings,
  activeId,
  onItemClick,
}: {
  headings: HeadingInfo[];
  activeId: string | null;
  onItemClick: (id: string) => void;
}) {
  if (!headings || headings.length === 0) {
    return null;
  }

  return (
    <aside className="doc-toc" aria-label="文章目录">
      <div className="doc-toc-title">目录</div>
      <nav className="doc-toc-list" aria-label="目录">
        {headings.map((heading) => (
          <button
            key={heading.id}
            type="button"
            className={cn(
              'doc-toc-item',
              `doc-toc-level-${heading.level}`,
              heading.id === activeId && 'doc-toc-item-active'
            )}
            aria-current={heading.id === activeId ? 'location' : undefined}
            onClick={() => onItemClick(heading.id)}
          >
            <span className="doc-toc-item-text">{heading.text}</span>
          </button>
        ))}
      </nav>
    </aside>
  );
}

export function DocPageClient({ doc, docs, breadcrumb, adjacent, path }: DocPageClientProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [headings, setHeadings] = useState<HeadingInfo[]>([]);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [mobileSidebarView, setMobileSidebarView] = useState<'toc' | 'docs'>('toc');
  const headingOffset = 120;
  const authorLabel = doc.author?.trim() ? doc.author.trim() : 'ChargeBaby 团队';

  const handleHeadingsChange = useCallback((items: HeadingInfo[]) => {
    setHeadings(items.filter((item) => item.level >= 1 && item.level <= 3));
  }, []);

  useEffect(() => {
    if (headings.length === 0) {
      setActiveHeadingId(null);
      return;
    }

    let frameId: number | null = null;

    const updateActiveHeading = () => {
      const scrollPosition = window.scrollY + headingOffset;
      let current: string | null = headings[0]?.id ?? null;

      for (const heading of headings) {
        const element = document.getElementById(heading.id);
        if (!element) {
          continue;
        }
        const elementTop = element.getBoundingClientRect().top + window.scrollY;
        if (elementTop <= scrollPosition) {
          current = heading.id;
        } else {
          break;
        }
      }

      setActiveHeadingId((prev) => (current === prev ? prev : current));
      frameId = null;
    };

    const handleScroll = () => {
      if (frameId !== null) {
        return;
      }
      frameId = window.requestAnimationFrame(updateActiveHeading);
    };

    const handleResize = () => {
      updateActiveHeading();
    };

    updateActiveHeading();

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      if (frameId !== null) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [headings]);

  const handleTocItemClick = useCallback((headingId: string) => {
    if (typeof window === 'undefined') {
      return;
    }

    const target = document.getElementById(headingId);
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - headingOffset;

    window.scrollTo({ top: top < 0 ? 0 : top, behavior: 'smooth' });
    setActiveHeadingId(headingId);

    if (typeof window.history?.replaceState === 'function') {
      window.history.replaceState(null, '', `#${headingId}`);
    }
  }, []);

  useEffect(() => {
    setMobileSidebarView('toc');
  }, [path]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-slate-950 transition-colors">
      {/* 移动端页眉 */}
      <header className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-slate-950 border-b border-gray-200 dark:border-slate-800 z-30 transition-colors">
        <div className="flex items-center justify-between px-4 py-1.5">
          <button
            type="button"
            className="flex items-center gap-2 text-gray-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            onClick={() => {
              setMobileSidebarView('toc');
              setIsSidebarOpen(true);
            }}
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-medium">菜单</span>
          </button>
          <ThemeToggle
            size="sm"
            className="border-transparent bg-transparent hover:bg-transparent focus-visible:ring-offset-0 text-gray-700 hover:text-blue-500 dark:text-slate-200 dark:hover:text-blue-400 p-0"
          />
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
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        headings={headings}
        activeHeadingId={activeHeadingId}
        onTocItemClick={handleTocItemClick}
        mobileView={mobileSidebarView}
        onMobileViewChange={setMobileSidebarView}
      />

      {/* 主内容区 */}
      <main className={`gitbook-main-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="gitbook-toolbar hidden lg:flex items-center justify-between">
        <DocBreadcrumb breadcrumb={breadcrumb} />
        <ThemeToggle />
      </div>

      <div className="gitbook-content-wrapper">
          {/* 面包屑导航（移动端显示） */}
          <div className="mb-4 pt-12 lg:pt-0 lg:hidden">
            <DocBreadcrumb breadcrumb={breadcrumb} />
          </div>

          <div className="doc-layout">
            <article id="doc-article-start" className="doc-article">
              {/* 文档头部 */}
              <header className="doc-article-header space-y-4">
                <div className="doc-article-title-row">
                  {doc.icon && (
                    <div className="doc-article-icon" aria-hidden>{doc.icon}</div>
                  )}
                  <h1 className="doc-article-title text-pretty clear-right">
                    {doc.title}
                  </h1>
                </div>
                {doc.description && (
                  <p className="doc-article-description clear-both">{doc.description}</p>
                )}

                {/* 元信息 */}
                <div className="doc-article-meta">
                  <div className="doc-article-meta-item">
                    <Clock className="w-4 h-4" />
                    <span>
                      由 {authorLabel} 更新于 {formatDate(doc.updatedAt)}
                    </span>
                  </div>
                  {doc.tags.length > 0 && (
                    <div className="doc-article-meta-item">
                      <Tags className="w-4 h-4" />
                      <div className="doc-article-tags">
                        {doc.tags.map((tag) => (
                          <span
                            key={tag}
                            className="doc-article-tag"
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
                  <MarkdownRenderer content={doc.content} onHeadingsChange={handleHeadingsChange} />
                </div>
              </section>

              {/* 文档导航 */}
              {(adjacent.prev || adjacent.next) && (
                <footer className="doc-article-footer">
                  <DocNavigation prev={adjacent.prev} next={adjacent.next} />
                </footer>
              )}
            </article>
            <DocTableOfContents
              headings={headings}
              activeId={activeHeadingId}
              onItemClick={handleTocItemClick}
            />
          </div>

        </div>
      </main>
    </div>
  );
}
