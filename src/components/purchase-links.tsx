'use client';

import { FileText, ExternalLink, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChargeBaby } from '@/types/chargebaby';

interface PurchaseLinksProps {
  className?: string;
  chargeBaby: ChargeBaby;
  variant?: 'mobile' | 'desktop';
}

export function PurchaseLinks({ className, chargeBaby, variant = 'mobile' }: PurchaseLinksProps) {
  // 构建按钮数组，只包含有链接的按钮
  const buttons: Array<{
    label: string;
    icon: LucideIcon;
    href: string;
    isInternal: boolean;
    color?: string;
  }> = [];

  // 详细数据按钮（始终显示）
  buttons.push({
    label: '详细数据',
    icon: FileText,
    href: `/${encodeURIComponent(chargeBaby.model)}/detail`,
    isInternal: true,
  });

  // 淘宝链接（如果存在）
  if (chargeBaby.taobaoLink) {
    buttons.push({
      label: '淘宝',
      icon: ExternalLink,
      href: chargeBaby.taobaoLink,
      isInternal: false,
      color: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    });
  }

  // 京东链接（如果存在）
  if (chargeBaby.jdLink) {
    buttons.push({
      label: '京东',
      icon: ExternalLink,
      href: chargeBaby.jdLink,
      isInternal: false,
      color: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
    });
  }

  const isMobile = variant === 'mobile';

  // 动态计算网格列数和布局
  const getGridLayout = () => {
    const buttonCount = buttons.length;
    
    if (buttonCount === 1) {
      // 只有详细数据按钮：较窄的单列，左对齐
      return {
        gridClass: 'grid-cols-1',
        containerClass: isMobile ? 'max-w-36' : 'max-w-44', // 根据设备调整宽度
        buttonClass: 'justify-start' // 左对齐内容
      };
    }
    
    if (buttonCount === 2) {
      // 两个按钮：紧凑的双列布局
      return {
        gridClass: 'grid-cols-2',
        containerClass: isMobile ? 'max-w-64' : 'max-w-80', // 根据设备调整宽度
        buttonClass: 'justify-center' // 居中内容
      };
    }
    
    // 三个按钮：标准布局
    return {
      gridClass: 'grid-cols-3',
      containerClass: 'max-w-lg',
      buttonClass: 'justify-center' // 居中内容
    };
  };

  const layout = getGridLayout();

  return (
    <div className={cn('w-full', className)}>
      {/* 使用网格布局，根据按钮数量动态调整 */}
      <div className={cn(
        'grid gap-3',
        layout.gridClass,
        layout.containerClass
      )}>
        {buttons.map((button) => {
          const Icon = button.icon;
          const isDetailData = button.label === '详细数据';
          
          return (
            <a
              key={button.label}
              href={button.href}
              target={button.isInternal ? '_self' : '_blank'}
              rel={button.isInternal ? undefined : 'noopener noreferrer'}
              className={cn(
                'flex items-center gap-2 py-3 px-4 rounded-lg text-sm font-medium',
                'border transition-all duration-200 relative min-h-[44px]',
                'hover:shadow-sm active:scale-[0.98] active:duration-75',
                // 动态对齐方式
                layout.buttonClass,
                // 移动端优化
                isMobile ? [
                  'text-xs py-2.5',
                  buttons.length === 1 ? 'px-4' : 'px-3'
                ] : [
                  'text-sm py-3',
                  buttons.length === 1 ? 'px-5' : 'px-4'
                ],
                // 样式变体
                isDetailData
                  ? 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                  : button.color
              )}
            >
              <Icon className={cn(
                'flex-shrink-0',
                isMobile ? 'w-3.5 h-3.5' : 'w-4 h-4'
              )} />
              <span className={cn(
                'font-medium',
                // 根据按钮数量调整文字显示
                isMobile && buttons.length === 3 ? 'text-[11px]' : 'whitespace-nowrap'
              )}>
                {button.label}
              </span>
            </a>
          );
        })}
      </div>
      
      {/* 根据按钮数量显示不同的提示信息 */}
      {buttons.length === 1 && (
        <div className="mt-2 text-xs text-gray-500">
          查看详细测试数据和技术参数
        </div>
      )}
      
      {buttons.length === 2 && (
        <div className="mt-2 text-xs text-gray-400 opacity-75">
          点击查看详细数据或购买链接
        </div>
      )}
    </div>
  );
}