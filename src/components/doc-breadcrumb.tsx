import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { DocPage } from '@/lib/notion';

interface DocBreadcrumbProps {
  breadcrumb: DocPage[];
}

export function DocBreadcrumb({ breadcrumb }: DocBreadcrumbProps) {
  if (breadcrumb.length === 0) {
    return null;
  }

  // 确保路径格式正确
  const normalizePath = (path: string) => {
    if (path.startsWith('/docs/')) return path;
    return path === '/' ? '/docs' : `/docs${path}`;
  };

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-2 text-sm font-medium text-gray-500 dark:text-slate-400">
        <li className="flex items-center gap-1.5">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 no-underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            文档
          </Link>
        </li>

        {breadcrumb.map((item, index) => (
          <li key={item.id} className="flex items-center gap-2">
            <ChevronRight className="w-3 h-3 text-gray-400 dark:text-slate-500" />
            {index === breadcrumb.length - 1 ? (
              <span className="flex items-center gap-1.5 text-gray-900 dark:text-slate-100 font-semibold">
                {item.icon && <span className="text-sm">{item.icon}</span>}
                {item.title}
              </span>
            ) : (
              <Link
                href={normalizePath(item.path)}
                className="flex items-center gap-1.5 no-underline hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {item.icon && <span className="text-sm">{item.icon}</span>}
                {item.title}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
