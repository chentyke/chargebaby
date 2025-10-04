'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, ChevronLeft, Home } from 'lucide-react';
import { DocPage } from '@/lib/notion';
import { cn } from '@/lib/utils';

interface DocSidebarProps {
  docs: DocPage[];
  currentPath: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

interface DocItemProps {
  doc: DocPage;
  level: number;
  currentPath: string;
  isCollapsed: boolean;
}

function DocItem({ doc, level, currentPath, isCollapsed }: DocItemProps) {
  // 确保路径格式统一 - 都使用 /docs/ 开头的格式
  const normalizePath = (path: string) => {
    if (path.startsWith('/docs/')) return path;
    return path === '/' ? '/docs' : `/docs${path}`;
  };

  const currentPathNormalized = normalizePath(currentPath);
  const docPathNormalized = normalizePath(doc.path);

  const [isExpanded, setIsExpanded] = useState(() => {
    return doc.children.some(child =>
      currentPathNormalized === normalizePath(child.path) ||
      currentPathNormalized.startsWith(normalizePath(child.path)) ||
      child.children.some(subChild => currentPathNormalized.startsWith(normalizePath(subChild.path)))
    );
  });
  const isActive = currentPathNormalized === docPathNormalized;
  const hasActiveChild = doc.children.some(child =>
    currentPathNormalized.startsWith(normalizePath(child.path)) ||
    child.children.some(subChild => currentPathNormalized.startsWith(normalizePath(subChild.path)))
  );

  const hasChildren = doc.children.length > 0;

  if (isCollapsed) {
    return (
      <div className="select-none">
        <Link
          href={docPathNormalized}
          className={cn(
            'flex items-center justify-center px-3 py-2 rounded-md text-sm transition-all duration-200',
            'hover:bg-gray-100',
            isActive && 'bg-blue-50 text-blue-700',
            !isActive && hasActiveChild && 'text-blue-600',
            !isActive && !hasActiveChild && 'text-gray-700 hover:text-gray-900'
          )}
          title={doc.title}
        >
          <span className="text-lg">{doc.icon}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="select-none">
      <div className="group">
        <Link
          href={docPathNormalized}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-all duration-200',
            'hover:bg-gray-100',
            isActive && 'bg-blue-50 text-blue-700 font-medium',
            !isActive && hasActiveChild && 'text-blue-600 font-medium',
            !isActive && !hasActiveChild && 'text-gray-700 hover:text-gray-900'
          )}
          style={{ paddingLeft: `${level * 12 + 12}px` }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              <svg
                className={cn(
                  'w-4 h-4 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          )}
          {!hasChildren && (
            <span className="w-5 h-5 flex items-center justify-center">
              <span className="text-xs">{doc.icon}</span>
            </span>
          )}
          <span className="flex-1 truncate">{doc.title}</span>
        </Link>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {doc.children.map((child) => (
            <DocItem
              key={child.id}
              doc={child}
              level={level + 1}
              currentPath={currentPath}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function DocSidebar({ docs, currentPath, isCollapsed = false, onToggle }: DocSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="h-full flex flex-col">
      {/* 标题 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <Link
            href="/docs"
            className="flex items-center gap-2 text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors"
          >
            <span className="text-xl">📚</span>
            <span>文档中心</span>
          </Link>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "p-1.5 rounded-md hover:bg-gray-100 transition-all duration-200",
            isCollapsed ? "mx-auto" : "ml-auto"
          )}
          title={isCollapsed ? "展开侧边栏" : "收起侧边栏"}
        >
          {isCollapsed ? (
            <ChevronLeft className="w-5 h-5 text-gray-600 rotate-180" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* 导航列表 */}
      <nav className="flex-1 p-4 overflow-y-auto">
        {docs.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">📭</div>
            {!isCollapsed && <p className="text-sm text-gray-500">暂无文档</p>}
          </div>
        ) : (
          <div className="space-y-1">
            {docs.map((doc) => (
              <DocItem
                key={doc.id}
                doc={doc}
                level={0}
                currentPath={currentPath}
                isCollapsed={isCollapsed}
              />
            ))}
          </div>
        )}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors mb-2"
            >
              <Home className="w-3 h-3" />
              <span>返回 ChargeDB</span>
            </Link>
            <p className="text-gray-400">ChargeDB 数据库</p>
          </>
        ) : (
          <Link
            href="/"
            className="flex items-center justify-center"
            title="返回 ChargeDB"
          >
            <Home className="w-4 h-4 text-gray-600 hover:text-blue-600 transition-colors" />
          </Link>
        )}
      </div>
    </div>
  );
}