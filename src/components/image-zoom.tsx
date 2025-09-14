'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, Download, RotateCcw, Move, Maximize2 } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ImageZoomProps {
  src: string;
  alt: string;
  className?: string;
  children?: React.ReactNode;
}

interface Position {
  x: number;
  y: number;
}

interface TouchState {
  isPinching: boolean;
  lastDistance: number;
  center: Position;
}

export function ImageZoom({ src, alt, className, children }: ImageZoomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [initialImageSize, setInitialImageSize] = useState<{width: number, height: number} | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [touchState, setTouchState] = useState<TouchState>({
    isPinching: false,
    lastDistance: 0,
    center: { x: 0, y: 0 }
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const originalImageRef = useRef<HTMLSpanElement>(null);

  const minScale = isMobile ? 0.1 : 0.5;
  const maxScale = isMobile ? 3 : 5;
  const zoomStep = isMobile ? 0.25 : 0.5;

  useEffect(() => {
    setMounted(true);
    // 检测移动端
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsAnimating(true);
    } else {
      document.body.style.overflow = 'unset';
      // Reset zoom state when closed
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // 图片加载完成后计算初始适配
  const handleImageLoad = useCallback(() => {
    if (imageRef.current && containerRef.current) {
      const img = imageRef.current;
      const container = containerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width - (isMobile ? 32 : 128); // 减去padding
      const containerHeight = containerRect.height - (isMobile ? 32 : 128);
      
      const imageNaturalWidth = img.naturalWidth;
      const imageNaturalHeight = img.naturalHeight;
      
      setInitialImageSize({ width: imageNaturalWidth, height: imageNaturalHeight });
      
      // 计算初始缩放比例，确保图片完全显示在容器内
      const scaleX = containerWidth / imageNaturalWidth;
      const scaleY = containerHeight / imageNaturalHeight;
      const initialScale = Math.min(scaleX, scaleY, 1); // 不放大，只缩小
      
      if (initialScale < 1) {
        setScale(initialScale);
      }
    }
  }, [isMobile]);

  const handleOpen = () => {
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
    }, 300);
  }, []);

  const resetView = useCallback(() => {
    if (isMobile && imageRef.current && containerRef.current) {
      // 移动端重置到适配尺寸
      const img = imageRef.current;
      const container = containerRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width - 32;
      const containerHeight = containerRect.height - 32;
      
      const scaleX = containerWidth / img.naturalWidth;
      const scaleY = containerHeight / img.naturalHeight;
      const initialScale = Math.min(scaleX, scaleY, 1);
      
      setScale(initialScale);
    } else {
      setScale(1);
    }
    setPosition({ x: 0, y: 0 });
  }, [isMobile]);

  const handleZoomIn = useCallback(() => {
    setScale(prev => Math.min(prev + zoomStep, maxScale));
  }, [zoomStep, maxScale]);

  const handleZoomOut = useCallback(() => {
    setScale(prev => {
      const newScale = Math.max(prev - zoomStep, minScale);
      if (newScale === minScale) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  }, [zoomStep, minScale]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.2 : 0.2;
    setScale(prev => Math.min(Math.max(prev + delta, minScale), maxScale));
  }, [minScale, maxScale]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  }, [isDragging, scale, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handlers for mobile
  const getTouchDistance = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const getTouchCenter = (touches: React.TouchList) => {
    const touch1 = touches[0];
    const touch2 = touches[1];
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  };

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      const center = getTouchCenter(e.touches);
      setTouchState({
        isPinching: true,
        lastDistance: distance,
        center
      });
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      setDragStart({ x: touch.clientX - position.x, y: touch.clientY - position.y });
    }
  }, [scale, position]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    
    if (e.touches.length === 2 && touchState.isPinching) {
      const distance = getTouchDistance(e.touches);
      const scaleChange = distance / touchState.lastDistance;
      
      setScale(prev => Math.min(Math.max(prev * scaleChange, minScale), maxScale));
      setTouchState(prev => ({ ...prev, lastDistance: distance }));
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    }
  }, [touchState, isDragging, scale, dragStart]);

  const handleTouchEnd = useCallback(() => {
    setTouchState({
      isPinching: false,
      lastDistance: 0,
      center: { x: 0, y: 0 }
    });
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(async () => {
    setIsLoading(true);
    try {
      // 首先尝试直接下载
      const link = document.createElement('a');
      link.href = src;
      link.download = alt || '图片下载';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 如果直接下载不行，尝试fetch
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
        // 如果所有方法都失败，尝试在新标签页打开
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
      case 'd':
      case 'D':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleDownload();
        }
        break;
    }
  }, [handleClose, handleZoomIn, handleZoomOut, resetView, handleDownload]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      const container = containerRef.current;
      container.addEventListener('wheel', handleWheel, { passive: false });
      document.addEventListener('keydown', handleKeyDown);
      
      return () => {
        container.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, handleWheel, handleKeyDown]);

  const ZoomModal = () => {
    if (!mounted || !isOpen) return null;

    return createPortal(
      <div
        ref={containerRef}
        className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md transition-all duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        {/* 顶部工具栏 */}
        <div 
          className={`absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent transition-all duration-300 ${
            isAnimating ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 左侧信息 */}
          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20">
              <span className="text-white text-sm font-medium">
                {Math.round(scale * 100)}%
              </span>
            </div>
            {alt && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/20 max-w-sm">
                <span className="text-white/90 text-sm truncate">{alt}</span>
              </div>
            )}
          </div>

          {/* 右侧关闭按钮 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg p-2.5 border border-white/20 text-white transition-all duration-200 transform hover:scale-105"
            aria-label="关闭图片"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 图片容器 */}
        <div
          className={`relative w-full h-full flex items-center justify-center ${isMobile ? 'p-4' : 'p-16'} transform transition-all duration-300 ease-out ${
            isAnimating
              ? 'scale-100 opacity-100 translate-y-0'
              : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imageRef}
            src={src}
            alt={alt}
            className={`transition-transform duration-200 ease-out select-none ${
              isMobile ? 'max-w-full max-h-full' : 'max-w-none'
            }`}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
              filter: 'drop-shadow(0 25px 50px rgba(0, 0, 0, 0.3))'
            }}
            draggable={false}
            onLoad={handleImageLoad}
          />
        </div>

        {/* 底部控制栏 */}
        <div 
          className={`absolute bottom-0 left-0 right-0 z-50 flex items-center justify-center p-6 bg-gradient-to-t from-black/50 to-transparent transition-all duration-300 ${
            isAnimating ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
          }`}
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
                disabled={scale <= minScale}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                disabled={scale >= maxScale}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
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
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed text-white transition-all duration-200 transform hover:scale-105 active:scale-95"
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

        {/* 操作提示 */}
        {scale > 1 && (
          <div className={`absolute top-20 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10 transition-all duration-300 ${
            isAnimating ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
          }`}>
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <Move className="w-3 h-3" />
              <span>拖拽移动图片</span>
            </div>
          </div>
        )}
      </div>,
      document.body
    );
  };

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
      <ZoomModal />
    </>
  );
}