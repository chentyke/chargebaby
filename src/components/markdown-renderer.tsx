'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ReactNode } from 'react';

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
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6 first:mt-0 leading-tight border-b border-gray-200 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-5 leading-tight border-b border-gray-100 pb-1">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4 leading-tight">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-gray-900 mb-2 mt-3 leading-tight">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-gray-900 mb-2 mt-3 leading-tight">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-gray-900 mb-1 mt-2 leading-tight">
              {children}
            </h6>
          ),
          p: ({ children }) => (
            <p className="text-gray-700 mb-4 leading-relaxed text-[15px]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-700 leading-relaxed text-[15px]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-3 mb-4 bg-blue-50/50 rounded-r-lg">
              <div className="text-gray-700 italic">
                {children}
              </div>
            </blockquote>
          ),
          code: ({ inline, children }: { inline?: boolean; children: ReactNode }) => {
            if (inline) {
              return (
                <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md text-sm font-mono border">
                  {children}
                </code>
              );
            }
            return (
              <pre className="bg-gray-50 border border-gray-200 p-4 rounded-lg mb-4 overflow-x-auto shadow-sm">
                <code className="text-gray-800 text-sm font-mono leading-relaxed">
                  {children}
                </code>
              </pre>
            );
          },
          img: ({ src, alt }) => (
            <>
              <img
                src={src}
                alt={alt || ''}
                className="w-full rounded-lg shadow-sm border border-gray-200 mb-2"
                loading="lazy"
              />
              {alt && (
                <span className="block text-center text-sm text-gray-500 mb-4 italic">
                  {alt}
                </span>
              )}
            </>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto mb-6 rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full">
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
            <tbody className="divide-y divide-gray-200 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-gray-50/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 text-sm text-gray-700">
              {children}
            </td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-gray-900">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-700">
              {children}
            </em>
          ),
          hr: () => (
            <hr className="my-6 border-t border-gray-200" />
          ),
          span: ({ style, children, ...props }) => (
            <span 
              style={style} 
              className="inline-block" 
              {...props}
            >
              {children}
            </span>
          ),
          u: ({ children }) => (
            <span className="underline decoration-2 underline-offset-2">
              {children}
            </span>
          ),
          details: ({ children }) => (
            <details className="mb-4 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              {children}
            </details>
          ),
          summary: ({ children }) => (
            <summary className="font-semibold text-gray-900 cursor-pointer hover:text-gray-700 p-4 rounded-t-lg hover:bg-gray-100 transition-colors select-none">
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
