'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

export function ImageZoom({ src, alt, className, children }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // 使用refs来存储所有变化的值，避免state更新导致重渲染
  const scaleRef = useRef(1);
  const positionRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLSpanElement>(null);
  const animationFrameRef = useRef<number>();
  
  const minScale = 0.5;
  const maxScale = 5;
  const zoomStep = 0.5;

  useEffect(() => {
    setMounted(true);
  }, []);

  // 更新图片transform的函数
  const updateImageTransform = useCallback(() => {
    if (imageRef.current) {
      const { x, y } = positionRef.current;
      const scale = scaleRef.current;
      imageRef.current.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    // 重置所有状态
    scaleRef.current = 1;
    positionRef.current = { x: 0, y: 0 };
    isDraggingRef.current = false;
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    positionRef.current = { x: 0, y: 0 };
    updateImageTransform();
  }, [updateImageTransform]);

  const handleZoomIn = useCallback(() => {
    scaleRef.current = Math.min(scaleRef.current + zoomStep, maxScale);
    updateImageTransform();
  }, [updateImageTransform]);

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(scaleRef.current - zoomStep, minScale);
    scaleRef.current = newScale;
    if (newScale === minScale) {
      positionRef.current = { x: 0, y: 0 };
    }
    updateImageTransform();
  }, [updateImageTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scaleRef.current > 1) {
      isDraggingRef.current = true;
      const { x, y } = positionRef.current;
      dragStartRef.current = { x: e.clientX - x, y: e.clientY - y };
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDraggingRef.current && scaleRef.current > 1) {
      const { x, y } = dragStartRef.current;
      positionRef.current = {
        x: e.clientX - x,
        y: e.clientY - y
      };
      
      // 使用requestAnimationFrame优化性能
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(updateImageTransform);
    }
  }, [updateImageTransform]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    scaleRef.current = Math.min(Math.max(scaleRef.current + delta, minScale), maxScale);
    updateImageTransform();
  }, [updateImageTransform]);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);
    try {
      const link = document.createElement('a');
      link.href = src;
      link.download = alt || '图片下载';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      try {
        const response = await fetch(src, {
          mode: 'cors',
          credentials: 'omit'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = alt || '图片下载';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (fetchError) {
        console.error('下载图片失败:', fetchError);
        window.open(src, '_blank');
      }
    } finally {
      setIsLoading(false);
    }
  }, [src, alt]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        handleClose();
        break;
      case '+':
      case '=':
        e.preventDefault();
        handleZoomIn();
        break;
      case '-':
        e.preventDefault();
        handleZoomOut();
        break;
      case '0':
        e.preventDefault();
        resetView();
        break;
    }
  }, [handleClose, handleZoomIn, handleZoomOut, resetView]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
      
      if (containerRef.current) {
        containerRef.current.addEventListener('wheel', handleWheel, { passive: false });
      }
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
      if (containerRef.current) {
        containerRef.current.removeEventListener('wheel', handleWheel);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isOpen, handleKeyDown, handleWheel]);

  if (!mounted || !isOpen) return (
    <>
      <span
        ref={originalImageRef}
        onClick={handleOpen}
        className={`cursor-zoom-in transition-all duration-200 hover:opacity-90 inline-block ${className || ''}`}
        title="点击放大图片"
      >
        {children}
      </span>
    </>
  );

  return (
    <>
      <span
        ref={originalImageRef}
        onClick={handleOpen}
        className={`cursor-zoom-in transition-all duration-200 hover:opacity-90 inline-block ${className || ''}`}
        title="点击放大图片"
      >
        {children}
      </span>
      
      {createPortal(
        <div
          ref={containerRef}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md"
          onClick={handleClose}
        >
          {/* 顶部工具栏 */}
          <div 
            className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              {alt && (
                <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
                  <span className="text-white/90 text-sm truncate">{alt}</span>
                </div>
              )}
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClose();
              }}
              className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-2.5 border border-white/20 text-white transition-all duration-200"
              aria-label="关闭图片"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 图片容器 */}
          <div
            className="relative w-full h-full flex items-center justify-center p-16"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imageRef}
              src={src}
              alt={alt}
              className="max-w-none transition-transform duration-200 ease-out select-none"
              style={{
                filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))',
                transform: 'translate(0px, 0px) scale(1)'
              }}
              draggable={false}
            />
          </div>

          {/* 底部控制栏 */}
          <div 
            className="absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center p-6 bg-gradient-to-t from-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-2 border border-white/20 shadow-lg">
              <div className="flex items-center gap-1">
                {/* 缩小按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                  aria-label="缩小"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                {/* 重置按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetView();
                  }}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                  aria-label="重置视图"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>

                {/* 放大按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200"
                  aria-label="放大"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {/* 分隔线 */}
                <div className="w-px h-6 bg-white/20 mx-1"></div>

                {/* 下载按钮 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload();
                  }}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white transition-all duration-200"
                  aria-label="下载图片"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}