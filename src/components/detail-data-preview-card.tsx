'use client';

import { useEffect, useState, useRef, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { ChargeBaby } from '@/types/chargebaby';
import { TitleWithTooltip } from '@/components/ui/title-with-tooltip';

interface DetailDataPreviewCardProps {
  chargeBaby: ChargeBaby;
  productModel: string;
  variant?: 'desktop' | 'mobile';
}

const WH_TO_MAH_CONVERSION = 1000 / 5;
const DISPLAY_VOLTAGE = '5V';

function formatMaxDischargeCapacity(value?: number | null): ReactNode {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '-';
  }

  const mahValue = Math.floor(value * WH_TO_MAH_CONVERSION);

  return (
    <>
      {`${value}Wh`}
      <span className="ml-1 text-gray-400">({mahValue}mAh {DISPLAY_VOLTAGE})</span>
    </>
  );
}

export function DetailDataPreviewCard({ chargeBaby, productModel, variant = 'desktop' }: DetailDataPreviewCardProps) {
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [currentTransform, setCurrentTransform] = useState('');
  const [cardPosition, setCardPosition] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef<number>(0);
  
  // 处理点击/滑动区分
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
  const mouseStart = useRef<{ x: number; y: number; time: number } | null>(null);
  
  useEffect(() => {
    setMounted(true);
    setWindowHeight(window.innerHeight);
    console.log('DetailDataPreviewCard mounted');
    
    if (typeof window !== 'undefined') {
      // 查找滚动容器
      const findScrollContainer = () => {
        // 移动端直接使用 window 滚动
        if (variant === 'mobile') {
          console.log('Mobile variant: using window scroll');
          return null; // 返回 null 表示使用 window
        }
        
        // 桌面端查找右侧滚动容器
        const containers = document.querySelectorAll('.overflow-y-auto');
        console.log('Found scroll containers:', containers.length);
        
        // 选择包含当前卡片的滚动容器
        for (let i = 0; i < containers.length; i++) {
          const container = containers[i];
          if (cardRef.current && container.contains(cardRef.current)) {
            console.log('Found parent scroll container');
            return container as HTMLElement;
          }
        }
        
        // 如果没找到父级滚动容器，使用第一个
        if (containers.length > 0) {
          console.log('Using first scroll container');
          return containers[0] as HTMLElement;
        }
        
        // 降级到 window
        console.log('Fallback to window scroll');
        return null;
      };

      const handleScroll = (event?: Event) => {
        let newScrollY = 0;
        let source = 'unknown';
        
        if (variant === 'mobile') {
          // 移动端强制使用 window.scrollY
          newScrollY = window.scrollY;
          source = 'window';
          console.log('Mobile scroll detected:', newScrollY);
        } else {
          // 桌面端使用容器滚动
          if (event && event.target !== window) {
            const target = event.target as HTMLElement;
            newScrollY = target.scrollTop;
            source = 'container';
          } else {
            newScrollY = window.scrollY;
            source = 'window';
          }
        }
        
        // 直接操作 DOM，完全绕过 React 状态更新
        if (contentRef.current) {
          let transformValue;
          
          if (variant === 'mobile') {
            // 移动端：根据卡片在页面中的位置动态计算
            const cardElement = cardRef.current;
            if (cardElement) {
              // 获取卡片相对于文档的位置
              const cardRect = cardElement.getBoundingClientRect();
              const cardTopInDocument = cardRect.top + newScrollY;
              
              // 当卡片刚好在视口中央时，显示详细数据的开始部分
              // 计算相对于卡片位置的偏移
              const relativeScroll = newScrollY - cardTopInDocument + (windowHeight / 2);
              const mobileOffset = relativeScroll - 200; // 基础偏移，让内容从合适位置开始显示
              
              transformValue = `translateY(${mobileOffset}px)`;
              
              console.log('Mobile calculation:', {
                scrollY: newScrollY,
                cardTopInDocument,
                relativeScroll,
                mobileOffset,
                windowHeight: windowHeight
              });
            } else {
              // 降级：简单计算
              transformValue = `translateY(${newScrollY - 1000}px)`;
            }
          } else {
            // 桌面端：保持原有逻辑
            const initialOffset = -800;
            transformValue = `translateY(${newScrollY + initialOffset}px)`;
          }
          
          contentRef.current.style.transform = transformValue;
          setCurrentTransform(transformValue);
          
          console.log(`${variant} transform:`, { newScrollY, transformValue });
        }
        
        // 降低频率更新调试信息（避免过多重渲染）
        if (Math.abs(newScrollY - lastScrollY.current) > 10) {
          lastScrollY.current = newScrollY;
          setScrollY(newScrollY);
          // 同时更新位置信息，减少单独的状态更新
          if (variant === 'mobile' && cardRef.current) {
            const cardRect = cardRef.current.getBoundingClientRect();
            const cardTopInDocument = cardRect.top + newScrollY;
            setCardPosition(cardTopInDocument);
          }
        }
      };
      
      // 等待组件渲染完成后绑定事件
      const timer = setTimeout(() => {
        // 初始化位置
        handleScroll();
        
        if (variant === 'mobile') {
          // 移动端始终使用 window 滚动
          window.addEventListener('scroll', handleScroll, { passive: true });
          console.log('Mobile: window scroll listener added');
          
          // 测试移动端滚动检测
          const testScroll = () => {
            console.log('Mobile test scroll - window.scrollY:', window.scrollY);
          };
          window.addEventListener('scroll', testScroll, { passive: true, once: true });
        } else {
          // 桌面端查找容器滚动
          const scrollContainer = findScrollContainer();
          
          if (scrollContainer) {
            // 绑定到滚动容器
            scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
            console.log('Desktop: container scroll listener added');
          } else {
            // 桌面端降级到全局滚动
            window.addEventListener('scroll', handleScroll, { passive: true });
            console.log('Desktop: fallback to window scroll listener');
          }
        }
      }, 100);
      
      return () => {
        clearTimeout(timer);
        
        // 清理事件监听器
        if (variant === 'mobile') {
          window.removeEventListener('scroll', handleScroll);
          console.log('Mobile: window scroll listener removed');
        } else {
          // 桌面端需要同时清理两种可能的绑定
          const scrollContainer = document.querySelector('.overflow-y-auto');
          if (scrollContainer) {
            scrollContainer.removeEventListener('scroll', handleScroll);
            console.log('Desktop: container scroll listener removed');
          }
          window.removeEventListener('scroll', handleScroll);
          console.log('Desktop: window scroll listener removed (fallback)');
        }
      };
    }
  }, [variant]);

  const { detailData } = chargeBaby;
  
  if (!detailData) {
    return null;
  }

  // 现在直接通过 DOM 操作控制 transform，不需要计算偏移量

  // 渲染详细数据页面内容（简化版）
  const renderDetailDataContent = () => {
    const isMobile = variant === 'mobile';
    
    console.log('renderDetailDataContent called:', { variant, isMobile, hasDetailData: !!detailData });
    
    return (
      <div className={`w-full bg-white ${isMobile ? 'space-y-4 p-3' : 'space-y-8 p-8'}`}>
        {/* 页面标题 */}
        <div className={`text-center border-b border-gray-200 ${isMobile ? 'pb-3' : 'pb-6'}`}>
          <h1 className={`font-bold text-gray-900 mb-1 ${isMobile ? 'text-xs' : 'text-xl'}`}>
            {chargeBaby.title} - 详细测试数据
          </h1>
          <p className={`text-gray-600 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>
            以下数据来自「{detailData.dataSource}」的测试，仅供参考
          </p>
        </div>

        {/* 物理规格 */}
        <div className={`bg-white rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
          <h2 className={`font-semibold text-gray-900 border-b border-gray-100 ${isMobile ? 'text-sm mb-2 pb-1' : 'text-lg mb-4 pb-2'}`}>
            物理规格
          </h2>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <DataItem label="尺寸" value={`${detailData.length} × ${detailData.width} × ${detailData.thickness} cm`} variant={variant} />
            <DataItem label="重量" value={`${detailData.weight}g`} variant={variant} />
            <DataItem label="体积" value={`${detailData.volume}cm³`} variant={variant} />
            <DataItem label="能量重量比" value={`${detailData.capacityWeightRatio} Wh/g`} variant={variant} />
            <DataItem label="能量体积比" value={`${detailData.capacityVolumeRatio} Wh/cm³`} variant={variant} />
          </div>
        </div>

        {/* 电池容量 */}
        <div className={`bg-white rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
          <h2 className={`font-semibold text-gray-900 border-b border-gray-100 ${isMobile ? 'text-sm mb-2 pb-1' : 'text-lg mb-4 pb-2'}`}>
            电池容量
          </h2>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <DataItem label="容量级别" value={`${detailData.capacityLevel}mAh`} variant={variant} />
            <DataItem
              label="最大放电容量"
              value={formatMaxDischargeCapacity(detailData.maxDischargeCapacity)}
              variant={variant}
            />
            <DataItem label="自充能量" value={`${detailData.selfChargingEnergy}Wh`} variant={variant} />
            <DataItem label="放电容量达成率" value={`${(detailData.dischargeCapacityAchievementRate * 100).toFixed(1)}%`} variant={variant} />
            <DataItem label="最大能量转换率" value={`${(detailData.maxEnergyConversionRate * 100).toFixed(1)}%`} variant={variant} />
          </div>
        </div>

        {/* 自充电性能 */}
        <div className={`bg-white rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
          <h2 className={`font-semibold text-gray-900 border-b border-gray-100 ${isMobile ? 'text-sm mb-2 pb-1' : 'text-lg mb-4 pb-2'}`}>
            自充电性能
          </h2>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <DataItem label="最大自充电功率" value={`${detailData.maxSelfChargingPower}W`} variant={variant} />
            <DataItem label="自充电时间" value={`${detailData.selfChargingTime}分钟`} variant={variant} />
            <DataItem label="平均自充电功率" value={`${detailData.avgSelfChargingPower}W`} variant={variant} />
            <DataItem label="20分钟充入能量" value={`${detailData.energy20min}Wh`} variant={variant} />
          </div>
        </div>

        {/* 输出性能 */}
        <div className={`bg-white rounded-lg border border-gray-200 ${isMobile ? 'p-3' : 'p-6'}`}>
          <h2 className={`font-semibold text-gray-900 border-b border-gray-100 ${isMobile ? 'text-sm mb-2 pb-1' : 'text-lg mb-4 pb-2'}`}>
            输出性能
          </h2>
          <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-3'}`}>
            <DataItem label="最大输出功率" value={`${detailData.maxOutputPower}W`} variant={variant} />
            <DataItem label="最大持续输出功率" value={`${detailData.maxContinuousOutputPower}W`} variant={variant} />
          </div>
        </div>

        {/* 数据来源 */}
        <div className={`bg-gray-50 rounded-lg ${isMobile ? 'p-3' : 'p-4'}`}>
          <h3 className={`font-medium text-gray-700 mb-1 ${isMobile ? 'text-xs' : 'text-sm'}`}>数据来源</h3>
          <p className={`text-gray-600 ${isMobile ? 'text-[10px]' : 'text-sm'}`}>{detailData.dataSource}</p>
        </div>
      </div>
    );
  };

  // 计算初始偏移量
  const getInitialOffset = () => {
    if (variant === 'mobile') {
      // 移动端：初始显示内容的某个部分，当前scrollY - 1000 
      // 如果页面一开始就滚动了，需要相应调整
      return -400; // 先显示部分内容
    } else {
      return -800; // 桌面端偏移量  
    }
  };

  const initialOffset = getInitialOffset();

  // 处理鼠标/触摸事件
  const handleStart = (clientX: number, clientY: number) => {
    const startData = { x: clientX, y: clientY, time: Date.now() };
    touchStart.current = startData;
    mouseStart.current = startData;
  };

  const handleEnd = (clientX: number, clientY: number) => {
    const start = touchStart.current || mouseStart.current;
    if (!start) return;

    const deltaX = Math.abs(clientX - start.x);
    const deltaY = Math.abs(clientY - start.y);
    const deltaTime = Date.now() - start.time;

    // 判断是否为点击：移动距离小于10px且时间小于300ms
    const isClick = deltaX < 10 && deltaY < 10 && deltaTime < 300;

    if (isClick) {
      // 跳转到详细页面
      router.push(`/${encodeURIComponent(productModel)}/detail`);
    }

    // 清理
    touchStart.current = null;
    mouseStart.current = null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    handleEnd(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touch = e.changedTouches[0];
    handleEnd(touch.clientX, touch.clientY);
  };

  return (
    <div ref={cardRef} className="relative h-full">
      
      {/* 固定在后面的详细数据页面内容 */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div 
          ref={contentRef}
          className="w-full min-h-[200vh]"
          style={{ 
            transform: `translateY(${initialOffset}px)`, // 初始位置
            willChange: 'transform',
            backfaceVisibility: 'hidden',
            transformStyle: 'preserve-3d',
          }}
        >
          {renderDetailDataContent()}
        </div>
      </div>

      {/* 透明边框 - 创建镂空窗口效果 + 点击区域 */}
      <div 
        className="absolute inset-0 rounded-2xl border-2 border-white/60 overflow-hidden cursor-pointer" 
        style={{
          background: 'transparent',
          boxShadow: 'inset 0 0 20px 8px rgba(0, 0, 0, 0.1), inset 0 0 40px 16px rgba(0, 0, 0, 0.05)'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* 向内的边缘模糊效果 */}
        <div className="absolute inset-0 rounded-2xl" style={{
          background: 'radial-gradient(ellipse at center, transparent 75%, rgba(255, 255, 255, 0.08) 85%, rgba(255, 255, 255, 0.15) 95%, rgba(255, 255, 255, 0.25) 100%)'
        }}></div>
        
        {/* 内侧细边框 */}
        <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/30"></div>
        
        {/* 右上角查看更多按钮 */}
        <div className="absolute top-3 right-3 z-10">
          <Link
            href={`/${encodeURIComponent(productModel)}/detail`}
            className={`inline-flex items-center gap-1 font-medium text-gray-700 hover:text-gray-900 transition-all duration-200 group ${
              variant === 'mobile' 
                ? 'text-xs' 
                : 'text-sm'
            }`}
            onClick={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <span>查看更多详细数据</span>
            <ArrowRight className={`group-hover:translate-x-0.5 transition-transform duration-200 ${
              variant === 'mobile' ? 'w-3 h-3' : 'w-4 h-4'
            }`} />
          </Link>
        </div>
        
      </div>
    </div>
  );
}

// 数据项组件
function DataItem({ label, value, variant = 'desktop' }: { label: string; value?: ReactNode; variant?: 'desktop' | 'mobile' }) {
  const isMobile = variant === 'mobile';
  const displayValue = value ?? '-';
  
  if (isMobile) {
    // 移动端：水平布局，节省空间
    return (
      <div className="flex justify-between items-center py-1">
        <div className="text-[10px] font-medium text-gray-700 flex-shrink-0">
          <TitleWithTooltip title={label} />
        </div>
        <div className="text-[10px] text-gray-900 font-semibold text-right">{displayValue}</div>
      </div>
    );
  }
  
  // 桌面端：垂直布局
  return (
    <div className="flex flex-col">
      <div className="text-xs font-medium text-gray-700 mb-1">
        <TitleWithTooltip title={label} />
      </div>
      <div className="text-sm text-gray-900 font-semibold">{displayValue}</div>
    </div>
  );
}
