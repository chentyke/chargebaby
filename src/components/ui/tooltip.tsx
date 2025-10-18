'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  className?: string;
}

export function Tooltip({ content, className = '' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [showContent, setShowContent] = useState(false);
  const [measuredSize, setMeasuredSize] = useState({ width: 0, height: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // 检测移动设备
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    const resizeObserver = new ResizeObserver(checkMobile);
    resizeObserver.observe(document.body);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // 测量tooltip实际尺寸
  const measureTooltipSize = useCallback(() => {
    if (!measureRef.current) {
      return { width: 280, height: 60 }; // 默认尺寸
    }

    const rect = measureRef.current.getBoundingClientRect();
    return {
      width: Math.max(240, Math.min(320, rect.width)),
      height: Math.max(50, rect.height)
    };
  }, []);

  // 计算工具提示位置 - 使用测量的实际尺寸
  const calculatePosition = useCallback(() => {
    if (!buttonRef.current) {
      return { top: 0, left: 0 };
    }

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const { width: tooltipWidth, height: tooltipHeight } = measuredSize.width > 0 ? measuredSize : measureTooltipSize();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const sidePadding = 16;
    const spacing = 12; // 确保不遮挡按钮的间距

    // 默认放在按钮上方，水平居中对齐按钮
    let left = buttonRect.left + buttonRect.width / 2 - tooltipWidth / 2;
    let top = buttonRect.top - tooltipHeight - spacing;

    // 确保左右不超出视口
    if (left < sidePadding) {
      left = sidePadding;
    } else if (left + tooltipWidth > viewportWidth - sidePadding) {
      left = viewportWidth - tooltipWidth - sidePadding;
    }

    const aboveTop = top;
    const belowTop = buttonRect.bottom + spacing;

    // 智能选择位置：优先上方，空间不足时放下方
    if (top < sidePadding) {
      if (belowTop + tooltipHeight <= viewportHeight - sidePadding) {
        top = belowTop; // 下方有足够空间
      } else {
        // 上下都不足，选择空间更大的位置
        const spaceAbove = buttonRect.top - sidePadding;
        const spaceBelow = viewportHeight - buttonRect.bottom - sidePadding;
        top = spaceAbove >= spaceBelow ? aboveTop : belowTop;
      }
    }

    // 最后确保不超出视口
    top = Math.max(sidePadding, Math.min(top, viewportHeight - tooltipHeight - sidePadding));

    return { top, left };
  }, [measuredSize, measureTooltipSize]);

  // 更新位置
  const updatePosition = useCallback(() => {
    const newPosition = calculatePosition();
    setPosition(newPosition);
  }, [calculatePosition]);

  // 处理显示
  const handleShow = useCallback(() => {
    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 显示容器但内容不可见，用于测量尺寸
    setIsVisible(true);
    setShowContent(false);

    // 短暂延迟后测量尺寸并重新定位
    timeoutRef.current = setTimeout(() => {
      const newSize = measureTooltipSize();
      setMeasuredSize(newSize);

      // 测量完成后立即更新位置
      const newPosition = calculatePosition();
      setPosition(newPosition);

      // 然后显示内容
      setTimeout(() => {
        setShowContent(true);
      }, 16); // 等待一帧确保位置更新
    }, 16);
  }, [calculatePosition, measureTooltipSize]);

  // 处理隐藏
  const handleHide = useCallback(() => {
    // 清除定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // 立即隐藏
    setShowContent(false);
    setIsVisible(false);
  }, []);

  // 设置监听器
  useEffect(() => {
    if (isMobile || !isVisible) {
      return;
    }

    // 清理之前的监听器
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    let rafId: number;
    const handleViewportChange = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('scroll', handleViewportChange, { passive: true, capture: true });
    window.addEventListener('resize', handleViewportChange, { passive: true });

    // 设置清理函数
    cleanupRef.current = () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleViewportChange, { capture: true });
      window.removeEventListener('resize', handleViewportChange);
    };

    return cleanupRef.current;
  }, [isMobile, isVisible, updatePosition]);

  // 组件卸载时的清理
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  // 移动端使用模态框，桌面端使用悬浮提示
  if (isMobile) {
    return (
      <div className={`relative inline-block ${className}`}>
        <button
          ref={buttonRef}
          type="button"
          onClick={() => setIsVisible(!isVisible)}
          className="ml-0.5 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="查看说明"
        >
          <HelpCircle className="w-3 h-3" />
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
          className="ml-1 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          aria-label="查看说明"
          aria-describedby={isVisible && showContent ? 'tooltip-description' : undefined}
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>

      {isVisible && (
        <>
          {/* 隐藏的测量元素 - 用于获取实际尺寸 */}
          <div
            ref={measureRef}
            className="fixed z-[9998] pointer-events-none opacity-0"
            style={{ top: '-9999px', left: '-9999px' }}
          >
            <div className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 min-w-64 max-w-80">
              <p className="leading-relaxed text-left tooltip-content">
                {content}
              </p>
            </div>
          </div>

          {/* 实际显示的tooltip */}
          <div
            className="fixed z-[9999]"
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              opacity: showContent ? 1 : 0,
              transition: 'opacity 0.15s ease-in-out',
              pointerEvents: 'none'
            }}
          >
            <div
              ref={tooltipRef}
              className="bg-gray-900 text-white text-sm rounded-lg py-3 px-4 shadow-xl border border-gray-700 min-w-64 max-w-80"
              role="tooltip"
              id="tooltip-description"
            >
              <p className="leading-relaxed text-left tooltip-content">
                {content}
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
