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
  const tooltipRef = useRef<HTMLDivElement>(null);

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
    if (!buttonRef.current) {
      return;
    }

    const rect = buttonRef.current.getBoundingClientRect();
    const measuredWidth = tooltipRef.current?.offsetWidth;
    const measuredHeight = tooltipRef.current?.offsetHeight;
    const tooltipWidth = measuredWidth ?? 320; // 默认宽度：max-w-80
    const tooltipHeight = measuredHeight ?? 100; // 默认高度估值
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const sidePadding = 16;
    const spacing = 8;

    // 默认放在按钮上方
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    let top = rect.top - tooltipHeight - spacing;

    // 先尝试保持左右在视口内
    if (left < sidePadding) {
      left = sidePadding;
    }
    if (left + tooltipWidth > viewportWidth - sidePadding) {
      left = viewportWidth - tooltipWidth - sidePadding;
    }

    const aboveTop = top;
    const belowTop = rect.bottom + spacing;

    // 如果上方空间不足，先尝试放到下方
    if (top < sidePadding) {
      top = belowTop;
    }

    // 如果下方空间也不足，则尝试再次放到上方
    if (top + tooltipHeight > viewportHeight - sidePadding) {
      if (top === belowTop && aboveTop >= sidePadding) {
        top = aboveTop;
      } else {
        // 最后兜底：让 Tooltip 留在视口内
        top = Math.max(
          sidePadding,
          Math.min(aboveTop, viewportHeight - tooltipHeight - sidePadding)
        );
      }
    }

    setPosition({ top, left });
  };

  const handleShow = () => {
    if (isVisible) {
      calculatePosition();
    } else {
      setIsVisible(true);
    }
  };

  const handleHide = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    if (isMobile || !isVisible) {
      return;
    }

    const updatePosition = () => calculatePosition();

    const rafId = requestAnimationFrame(updatePosition);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [isMobile, isVisible]);

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
              className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsVisible(false)}
            />
            {/* 底部弹出卡片 */}
            <div className="fixed inset-x-0 bottom-0 z-[9999] px-4 pb-6">
              <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
                <div className="flex items-center justify-center py-3">
                  <span className="h-1 w-12 rounded-full bg-gray-200" aria-hidden="true" />
                </div>
                <div className="relative px-5 pb-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-semibold text-gray-900">数据说明</h3>
                    <button
                      type="button"
                      onClick={() => setIsVisible(false)}
                      className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      aria-label="关闭说明"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="mt-3 max-h-[60vh] overflow-y-auto text-sm leading-relaxed text-gray-700 tooltip-content">
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
          <div
            ref={tooltipRef}
            className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 min-w-64 max-w-80 pointer-events-auto"
          >
            <p className="leading-relaxed text-left tooltip-content">
              {content}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
