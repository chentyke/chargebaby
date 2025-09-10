'use client';

import { useState, useEffect, useRef } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  className?: string;
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 计算工具提示位置
  const calculatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const tooltipWidth = 320; // max-w-80 = 320px
      const tooltipHeight = 100; // 估计高度
      
      // 计算最佳位置
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      let top = rect.top - tooltipHeight - 8; // 8px margin
      
      // 确保不超出屏幕边界
      if (left < 16) left = 16;
      if (left + tooltipWidth > window.innerWidth - 16) {
        left = window.innerWidth - tooltipWidth - 16;
      }
      if (top < 16) {
        top = rect.bottom + 8; // 如果上方空间不足，显示在下方
      }
      
      setPosition({ top, left });
    }
  };

  const handleShow = () => {
    setIsVisible(true);
    calculatePosition();
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  // 移动端使用模态框，桌面端使用悬浮提示
  if (isMobile) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="查看说明"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
        
        {isVisible && (
          <>
            {/* 背景遮罩 */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
              onClick={() => setIsVisible(false)}
            />
            {/* 模态框 */}
            <div className="fixed inset-x-4 top-1/2 transform -translate-y-1/2 z-[9999]">
              <div className="bg-white rounded-xl shadow-2xl max-h-80 overflow-y-auto border border-gray-200">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-base font-semibold text-gray-900">数据说明</h3>
                    <button
                      onClick={() => setIsVisible(false)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="text-gray-700 leading-relaxed text-sm tooltip-content">
                    {content}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  // 桌面端悬浮提示
  return (
    <>
      <div className={`relative inline-block ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onMouseEnter={handleShow}
          onMouseLeave={handleHide}
          onClick={handleShow}
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="查看说明"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
      
      {isVisible && (
        <div 
          className="fixed z-[9999] pointer-events-none"
          style={{ 
            top: `${position.top}px`, 
            left: `${position.left}px` 
          }}
          onMouseEnter={handleShow}
          onMouseLeave={handleHide}
        >
          <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 min-w-64 max-w-80 pointer-events-auto">
            <p className="leading-relaxed text-left tooltip-content">
              {content}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
