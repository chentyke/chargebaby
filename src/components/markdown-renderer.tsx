'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { useEffect } from 'react';
import { ImageZoom } from './image-zoom';
import { cn } from '@/lib/utils';

// 全局计数器，确保SSR一致性
let globalHeadingCounter = 0;

// 简单的哈希函数，确保相同输入产生相同输出
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 转换为32位整数
  }
  return Math.abs(hash).toString(36).substring(0, 6);
}

// 固定的ID生成器，确保SSR一致性
function generateUniqueId(text: string, level: number): string {
  if (!text) return `heading-${level}-1`;

  const baseId = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '');

  if (!baseId) return `heading-${level}-1`;

  // 增加全局计数器
  globalHeadingCounter++;

  // 生成一个基于内容和位置的哈希值
  const hash = simpleHash(text + level + globalHeadingCounter);

  return `${baseId}-${hash}`;
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  // 重置全局计数器
  useEffect(() => {
    globalHeadingCounter = 0;
  }, [content]);

  useEffect(() => {
    if (!content || typeof window === 'undefined') {
      return;
    }

    const toc = document.getElementById('table-of-contents') as HTMLDetailsElement | null;
    if (!toc) {
      return;
    }

    const mediaQuery = window.matchMedia('(max-width: 768px)');
    let previousMatch: boolean | null = null;

    const applyState = (isMobile: boolean, force = false) => {
      if (force || previousMatch !== isMobile) {
        toc.open = !isMobile;
        previousMatch = isMobile;
      }
    };

    applyState(mediaQuery.matches, true);

    const handleChange = (event: MediaQueryListEvent | MediaQueryList) => {
      const matches = 'matches' in event ? event.matches : mediaQuery.matches;
      applyState(matches);
    };

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (typeof mediaQuery.removeEventListener === 'function') {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [content]);

  if (!content) {
    return null;
  }

  return (
    <div className={`prose prose-gray max-w-none markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 1);
            return (
              <h1 id={id} className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 pb-2" {...props}>
                {children}
              </h1>
            );
          },
          h2: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 2);
            return (
              <h2 id={id} className="text-xl font-semibold text-gray-900 mb-3 mt-5 leading-tight border-b border-gray-100 pb-1" {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 3);
            return (
              <h3 id={id} className="text-lg font-semibold text-gray-900 mb-2 mt-4 leading-tight" {...props}>
                {children}
              </h3>
            );
          },
          h4: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 4);
            return (
              <h4 id={id} className="text-base font-semibold text-gray-900 mb-2 mt-3 leading-tight" {...props}>
                {children}
              </h4>
            );
          },
          h5: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 5);
            return (
              <h5 id={id} className="text-sm font-semibold text-gray-900 mb-2 mt-3 leading-tight" {...props}>
                {children}
              </h5>
            );
          },
          h6: ({ children, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 6);
            return (
              <h6 id={id} className="text-sm font-medium text-gray-900 mb-1 mt-2 leading-tight" {...props}>
                {children}
              </h6>
            );
          },
          p: ({ children, ...props }: any) => (
            <p className="text-gray-700 mb-4 leading-relaxed text-[15px]" {...props}>
              {children}
            </p>
          ),
          ul: ({ children, ...props }: any) => (
            <ul className="list-disc pl-5 mb-4 space-y-1" {...props}>
              {children}
            </ul>
          ),
          ol: ({ children, ...props }: any) => (
            <ol className="list-decimal pl-5 mb-4 space-y-1" {...props}>
              {children}
            </ol>
          ),
          li: ({ children, ...props }: any) => (
            <li className="text-gray-700 leading-relaxed text-[15px]" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }: any) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-3 mb-4 bg-blue-50/50 rounded-r-lg" {...props}>
              <div className="text-gray-700 italic">
                {children}
              </div>
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-mono border" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4 overflow-x-auto shadow-sm">
                <code className="text-gray-800 text-sm font-mono leading-relaxed" {...props}>
                  {children}
                </code>
              </pre>
            );
          },
          img: ({ src, alt, ...props }: any) => {
            // 检查是否是Notion图片，如果是则提供原图URL给放大功能
            const isNotionImage = src && (
              src.includes('prod-files-secure.s3.') || 
              src.includes('www.notion.so') ||
              src.includes('notion.so')
            );
            
            const originalSrc = isNotionImage ? `/api/image-proxy?url=${encodeURIComponent(src)}&size=original` : src;
            const displaySrc = isNotionImage ? `/api/image-proxy?url=${encodeURIComponent(src)}&size=large` : src;
            
            return (
              <>
                <ImageZoom src={originalSrc} alt={alt || ''} className="mb-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displaySrc}
                    alt={alt || ''}
                    className="w-full rounded-lg shadow-sm border border-gray-200"
                    loading="lazy"
                    {...props}
                  />
                </ImageZoom>
                {alt && (
                  <span className="block text-center text-sm text-gray-500 mb-4 italic">
                    {alt}
                  </span>
                )}
              </>
            );
          },
          a: ({ href, children, ...props }: any) => {
            const isHashLink = typeof href === 'string' && href.startsWith('#');
            const anchorProps = {
              href,
              className: 'text-blue-600 hover:text-blue-800 underline',
              ...(!isHashLink
                ? { target: '_blank' as const, rel: 'noopener noreferrer' }
                : {}),
              ...props,
            };

            return (
              <a {...anchorProps}>
                {children}
              </a>
            );
          },
          strong: ({ children, ...props }: any) => (
            <strong className="font-semibold text-gray-900" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }: any) => (
            <em className="italic text-gray-700" {...props}>
              {children}
            </em>
          ),
          hr: ({ ...props }: any) => (
            <hr className="my-6 border-t border-gray-200" {...props} />
          ),
          span: ({ style, children, ...props }: any) => (
            <span 
              style={style} 
              className="inline-block" 
              {...props}
            >
              {children}
            </span>
          ),
          u: ({ children, ...props }: any) => (
            <span className="underline decoration-2 underline-offset-2" {...props}>
              {children}
            </span>
          ),
          details: ({ children, node: _node, open, className, ...props }: any) => {
            const normalizedProps: Record<string, any> = { ...props };
            delete normalizedProps.open;

            if (open === '' || open === true) {
              normalizedProps.open = true;
            }

            const baseClass = className ? '' : 'mb-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm';
            const combinedClassName = cn(baseClass, className);

            return (
              <details suppressHydrationWarning className={combinedClassName} {...normalizedProps}>
                {children}
              </details>
            );
          },
          summary: ({ children, node: _node, className, ...props }: any) => {
            const text = typeof children === 'string' ? children : children?.toString?.() || '';
            const cleanText = text.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');
            const id = generateUniqueId(cleanText, 2);

            return (
              <summary
                id={id}
                className={cn(
                  className?.includes('notion-toc-summary')
                    ? ''
                    : 'font-semibold text-gray-900 cursor-pointer hover:text-gray-700 p-4 rounded-t-lg hover:bg-gray-100 transition-colors select-none',
                  className
                )}
                {...props}
              >
                <span className="summary-content">
                  <span className="summary-toggle-icon" aria-hidden="true">▸</span>
                  <span className="summary-text">{children}</span>
                </span>
              </summary>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
