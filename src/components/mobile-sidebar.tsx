'use client';

import { useState } from 'react';
import { DocSidebar } from './doc-sidebar';
import { DocPage } from '@/lib/notion';

interface MobileSidebarProps {
  docs: DocPage[];
  currentPath: string;
}

export function MobileSidebar({ docs, currentPath }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* 移动端菜单按钮 */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          onClick={toggleSidebar}
          className="bg-white p-2 rounded-lg shadow-md border border-gray-200"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* 移动端侧边栏覆盖层 */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={closeSidebar}
        />
      )}

      {/* 移动端侧边栏 */}
      <aside
        className={`lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transition-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="sticky top-0 h-full">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">📚 文档中心</span>
            <button
              type="button"
              onClick={closeSidebar}
              className="p-1 rounded hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <DocSidebar docs={docs} currentPath={currentPath} />
          </div>
        </div>
      </aside>
    </>
  );
}