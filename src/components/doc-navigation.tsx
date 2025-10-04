import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DocPage } from '@/lib/notion';

interface DocNavigationProps {
  prev: DocPage | null;
  next: DocPage | null;
}

export function DocNavigation({ prev, next }: DocNavigationProps) {
  // 确保路径格式正确
  const normalizePath = (path: string) => {
    if (path.startsWith('/docs/')) return path;
    return path === '/' ? '/docs' : `/docs${path}`;
  };

  return (
    <nav className="flex flex-col sm:flex-row items-center justify-between gap-4 py-8">
      {prev ? (
        <Link
          href={normalizePath(prev.path)}
          className="group flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors w-full sm:w-auto justify-start no-underline"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-all duration-200 group-hover:scale-110 flex-shrink-0">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <div className="text-left min-w-0 flex-1">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">上一页</p>
            <p className="text-sm font-medium truncate">{prev.title}</p>
          </div>
        </Link>
      ) : (
        <div className="w-full sm:w-auto"></div>
      )}

      {next ? (
        <Link
          href={normalizePath(next.path)}
          className="group flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors w-full sm:w-auto justify-end no-underline"
        >
          <div className="text-right min-w-0 flex-1">
            <p className="text-xs text-gray-500 mb-1 font-medium uppercase tracking-wide">下一页</p>
            <p className="text-sm font-medium truncate">{next.title}</p>
          </div>
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 group-hover:bg-blue-100 transition-all duration-200 group-hover:scale-110 flex-shrink-0">
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      ) : (
        <div className="w-full sm:w-auto"></div>
      )}
    </nav>
  );
}