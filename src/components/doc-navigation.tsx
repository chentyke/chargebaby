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
    <nav className="doc-nav">
      {prev ? (
        <Link
          href={normalizePath(prev.path)}
          className="doc-nav-link doc-nav-link-prev"
        >
          <ChevronLeft className="doc-nav-icon" />
          <div className="doc-nav-copy">
            <span className="doc-nav-label">上一页</span>
            <span className="doc-nav-title" title={prev.title}>{prev.title}</span>
          </div>
        </Link>
      ) : (
        <div className="doc-nav-placeholder" aria-hidden />
      )}

      {next ? (
        <Link
          href={normalizePath(next.path)}
          className="doc-nav-link doc-nav-link-next"
        >
          <div className="doc-nav-copy doc-nav-copy-right">
            <span className="doc-nav-label">下一页</span>
            <span className="doc-nav-title" title={next.title}>{next.title}</span>
          </div>
          <ChevronRight className="doc-nav-icon" />
        </Link>
      ) : (
        <div className="doc-nav-placeholder" aria-hidden />
      )}
    </nav>
  );
}
