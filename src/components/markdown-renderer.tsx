'use client';

import React, { memo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ImageZoom } from './image-zoom';
import { cn } from '@/lib/utils';

function flattenNodeToString(children: React.ReactNode): string {
  return React.Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child);
      }
      if (React.isValidElement(child)) {
        return flattenNodeToString(child.props.children);
      }
      return '';
    })
    .join('');
}

function cleanHeadingText(text: string): string {
  return text
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .trim();
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u4e00-\u9fa5-]/g, '')
    .replace(/-+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface MarkdownRendererProps {
  content: string;
  className?: string;
  onHeadingsChange?: (headings: HeadingInfo[]) => void;
}

export interface HeadingInfo {
  id: string;
  text: string;
  level: number;
}

function MarkdownRendererComponent({ content, className = '', onHeadingsChange }: MarkdownRendererProps) {
  const slugCounts: Record<string, number> = {};
  const headingNodeMap = new Map<string, string>();
  const registeredHeadingKeys = new Set<string>();

  const getHeadingNodeKey = (node: any, level: number, fallback: string) => {
    const start = node?.position?.start;

    if (start) {
      const line = typeof start.line === 'number' ? start.line : 'x';
      const column = typeof start.column === 'number' ? start.column : 'x';
      const offset = typeof start.offset === 'number' ? start.offset : 'x';
      return `${level}:${line}:${column}:${offset}`;
    }

    const existingId = node?.data?.hProperties?.id || node?.properties?.id;
    if (existingId) {
      return `${level}:prop:${existingId}`;
    }

    if (fallback) {
      return `${level}:${fallback}`;
    }

    return `${level}:fallback`; // 最差情况下仍然提供一个键
  };

  const buildStableId = (node: any, rawText: string, level: number) => {
    const slug = slugify(rawText) || `heading-${level}`;
    const start = node?.position?.start;

    let baseId = slug;

    if (start) {
      const parts: Array<string> = [];

      if (typeof start.line === 'number') {
        parts.push(start.line.toString(36));
      }

      if (typeof start.column === 'number') {
        parts.push(start.column.toString(36));
      }

      if (typeof start.offset === 'number') {
        parts.push(start.offset.toString(36));
      }

      if (parts.length > 0) {
        baseId = `${slug}-${parts.join('')}`;
      }
    }

    const nodeKey = getHeadingNodeKey(node, level, baseId);

    if (headingNodeMap.has(nodeKey)) {
      return headingNodeMap.get(nodeKey)!;
    }

    const count = slugCounts[baseId] ?? 0;
    const nextCount = count + 1;
    slugCounts[baseId] = nextCount;

    const finalId = count === 0 ? baseId : `${baseId}-${nextCount}`;
    headingNodeMap.set(nodeKey, finalId);
    return finalId;
  };

  const collectedHeadingsRef = useRef<HeadingInfo[]>([]);
  collectedHeadingsRef.current = [];

  useEffect(() => {
    if (!onHeadingsChange) {
      return;
    }

    const seen = new Set<string>();
    const uniqueHeadings: HeadingInfo[] = [];

    for (const heading of collectedHeadingsRef.current) {
      if (seen.has(heading.id)) {
        continue;
      }
      seen.add(heading.id);
      uniqueHeadings.push(heading);
    }

    onHeadingsChange(uniqueHeadings);
  }, [content, onHeadingsChange]);

  const registerHeading = (node: any, heading: HeadingInfo) => {
    if (!heading.text) {
      return;
    }
    const nodeKey = getHeadingNodeKey(node, heading.level, heading.id);

    if (registeredHeadingKeys.has(nodeKey)) {
      return;
    }

    registeredHeadingKeys.add(nodeKey);
    collectedHeadingsRef.current.push(heading);
  };

  if (!content) {
    return null;
  }

  return (
    <div className={`prose prose-gray max-w-none markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 1);
            registerHeading(node, { id, text, level: 1 });
            return (
              <h1 id={id} className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 dark:border-slate-700 pb-2" {...props}>
                {children}
              </h1>
            );
          },
          h2: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 2);
            registerHeading(node, { id, text, level: 2 });
            return (
              <h2 id={id} className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-3 mt-5 leading-tight border-b border-gray-100 dark:border-slate-700 pb-1" {...props}>
                {children}
              </h2>
            );
          },
          h3: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 3);
            registerHeading(node, { id, text, level: 3 });
            return (
              <h3 id={id} className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-2 mt-4 leading-tight" {...props}>
                {children}
              </h3>
            );
          },
          h4: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 4);
            return (
              <h4 id={id} className="text-base font-semibold text-gray-900 dark:text-slate-100 mb-2 mt-3 leading-tight" {...props}>
                {children}
              </h4>
            );
          },
          h5: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 5);
            return (
              <h5 id={id} className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 mt-3 leading-tight" {...props}>
                {children}
              </h5>
            );
          },
          h6: ({ children, node, ...props }: any) => {
            const text = cleanHeadingText(flattenNodeToString(children));
            const id = buildStableId(node, text, 6);
            return (
              <h6 id={id} className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-1 mt-2 leading-tight" {...props}>
                {children}
              </h6>
            );
          },
          p: ({ children, ...props }: any) => (
            <p className="text-gray-700 dark:text-slate-300 mb-4 leading-relaxed text-[15px]" {...props}>
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
            <li className="text-gray-700 dark:text-slate-300 leading-relaxed text-[15px]" {...props}>
              {children}
            </li>
          ),
          blockquote: ({ children, ...props }: any) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-3 mb-4 bg-blue-50/50 dark:bg-slate-900/60 rounded-r-lg" {...props}>
              <div className="text-gray-700 dark:text-slate-300 italic">
                {children}
              </div>
            </blockquote>
          ),
          code: ({ inline, children, ...props }: any) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 dark:bg-slate-800 dark:text-slate-100 px-2 py-1 rounded-md text-sm font-mono border border-gray-200 dark:border-slate-700" {...props}>
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-50 dark:bg-slate-900/70 border border-gray-200 dark:border-slate-700 p-4 rounded-lg mb-4 overflow-x-auto shadow-sm">
                <code className="text-gray-800 dark:text-slate-100 text-sm font-mono leading-relaxed" {...props}>
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
                    className="w-full rounded-lg shadow-sm border border-gray-200 dark:border-slate-700"
                    loading="lazy"
                    {...props}
                  />
                </ImageZoom>
                {alt && (
                  <span className="block text-center text-sm text-gray-500 dark:text-slate-400 mb-4 italic">
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
              className: 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline',
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
            <strong className="font-semibold text-gray-900 dark:text-slate-100" {...props}>
              {children}
            </strong>
          ),
          em: ({ children, ...props }: any) => (
            <em className="italic text-gray-700 dark:text-slate-300" {...props}>
              {children}
            </em>
          ),
          hr: ({ ...props }: any) => (
            <hr className="my-6 border-t border-gray-200 dark:border-slate-700" {...props} />
          ),
          span: ({ style, children, ...props }: any) => (
            <span 
              style={style} 
              className="inline-block dark:text-slate-200" 
              {...props}
            >
              {children}
            </span>
          ),
          u: ({ children, ...props }: any) => (
            <span className="underline decoration-2 underline-offset-2 dark:text-slate-200" {...props}>
              {children}
            </span>
          ),
          details: ({ children, node: _node, open, className, ...props }: any) => {
            const normalizedProps: Record<string, any> = { ...props };
            delete normalizedProps.open;

            if (open === '' || open === true) {
              normalizedProps.open = true;
            }

            const baseClass = className ? '' : 'mb-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm';
            const combinedClassName = cn(baseClass, className);

            return (
              <details suppressHydrationWarning className={combinedClassName} {...normalizedProps}>
                {children}
              </details>
            );
          },
          summary: ({ children, node, className, id: propId, ...props }: any) => {
            const classNameString = Array.isArray(className) ? className.join(' ') : className || '';
            const text = cleanHeadingText(flattenNodeToString(children));

            let level: number | null = null;
            if (classNameString.includes('heading-1')) {
              level = 1;
            } else if (classNameString.includes('heading-2')) {
              level = 2;
            } else if (classNameString.includes('heading-3')) {
              level = 3;
            }

            const effectiveLevel = level ?? 2;
            const id = propId || buildStableId(node, text, effectiveLevel);

            if (level) {
              registerHeading(node, { id, text, level });
            }

            return (
              <summary
                id={id}
                className={cn(
                  classNameString.includes('notion-toc-summary')
                    ? ''
                    : 'font-semibold text-gray-900 dark:text-slate-100 cursor-pointer hover:text-gray-700 dark:hover:text-slate-50 transition-colors select-none',
                  classNameString
                )}
                {...props}
              >
                <span className="summary-content">
                  <span className="summary-toggle-icon" aria-hidden="true"></span>
                  <span>{children}</span>
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

export const MarkdownRenderer = memo(MarkdownRendererComponent);
