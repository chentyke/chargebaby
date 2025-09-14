'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ReactNode } from 'react';
import { ImageZoom } from './image-zoom';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  if (!content) {
    return null;
  }

  return (
    <div className={`prose prose-gray max-w-none markdown-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          h1: ({ children, ...props }: any) => (
            <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 pb-2" {...props}>
              {children}
            </h1>
          ),
          h2: ({ children, ...props }: any) => (
            <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5 leading-tight border-b border-gray-100 pb-1" {...props}>
              {children}
            </h2>
          ),
          h3: ({ children, ...props }: any) => (
            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 leading-tight" {...props}>
              {children}
            </h3>
          ),
          h4: ({ children, ...props }: any) => (
            <h4 className="text-base font-semibold text-gray-900 mb-2 mt-3 leading-tight" {...props}>
              {children}
            </h4>
          ),
          h5: ({ children, ...props }: any) => (
            <h5 className="text-sm font-semibold text-gray-900 mb-2 mt-3 leading-tight" {...props}>
              {children}
            </h5>
          ),
          h6: ({ children, ...props }: any) => (
            <h6 className="text-sm font-medium text-gray-900 mb-1 mt-2 leading-tight" {...props}>
              {children}
            </h6>
          ),
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
          table: ({ children, ...props }: any) => (
            <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full" {...props}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }: any) => (
            <thead className="bg-gray-50" {...props}>
              {children}
            </thead>
          ),
          tbody: ({ children, ...props }: any) => (
            <tbody className="divide-y divide-gray-200 bg-white" {...props}>
              {children}
            </tbody>
          ),
          tr: ({ children, ...props }: any) => (
            <tr className="hover:bg-gray-50/50 transition-colors" {...props}>
              {children}
            </tr>
          ),
          th: ({ children, ...props }: any) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200" {...props}>
              {children}
            </th>
          ),
          td: ({ children, ...props }: any) => (
            <td className="px-4 py-3 text-sm text-gray-700" {...props}>
              {children}
            </td>
          ),
          a: ({ href, children, ...props }: any) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            >
              {children}
            </a>
          ),
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
          details: ({ children, ...props }: any) => (
            <details className="mb-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm" {...props}>
              {children}
            </details>
          ),
          summary: ({ children, ...props }: any) => (
            <summary className="font-semibold text-gray-900 cursor-pointer hover:text-gray-700 p-4 rounded-t-lg hover:bg-gray-100 transition-colors select-none" {...props}>
              <span className="inline-flex items-center">
                <span className="toggle-arrow mr-2 text-gray-500">▶</span>
                {children}
              </span>
            </summary>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
