'use client';

import { ExternalLink, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChargeBaby } from '@/types/chargebaby';
import { Tooltip } from '@/components/ui/tooltip';

const PRODUCT_SAMPLE_TOOLTIP = `我们是一个以在校学生为主的业余团队，因此没有足够的财力自行大量购买各类设备进行测试。因此非常感谢第三方能为我们提供评测样机。这让我们有机会接触到更多产品，为大家带来更丰富的评测内容。

虽然样机由第三方提供，但我们始终坚守评测的独立性、公平性与可靠性，所有测试流程均基于实际场景，数据真实客观，结论不受任何第三方因素干扰，力求为大家呈现最真实、有用的参考信息。`;

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

  // 删除详细数据按钮，因为已经有透视预览卡片

  // 淘宝链接（如果存在）
  if (chargeBaby.taobaoLink) {
    buttons.push({
      label: '淘宝',
      icon: ExternalLink,
      href: chargeBaby.taobaoLink,
      isInternal: false,
      color: 'bg-orange-500 text-white border-orange-600 hover:bg-orange-600',
    });
  }

  // 京东链接（如果存在）
  if (chargeBaby.jdLink) {
    buttons.push({
      label: '京东',
      icon: ExternalLink,
      href: chargeBaby.jdLink,
      isInternal: false,
      color: 'bg-red-500 text-white border-red-600 hover:bg-red-600',
    });
  }

  const isMobile = variant === 'mobile';

  // 动态计算网格列数和布局
  const getGridLayout = () => {
    const buttonCount = buttons.length;
    
    if (buttonCount === 0) {
      // 没有购买链接时，隐藏整个组件
      return null;
    }
    
    if (buttonCount === 1) {
      // 单个购买按钮：居中显示
      return {
        gridClass: 'grid-cols-1',
        containerClass: isMobile ? 'max-w-36' : 'max-w-44', // 根据设备调整宽度
        buttonClass: 'justify-center' // 居中内容
      };
    }
    
    // 两个或更多按钮：双列或多列布局
    return {
      gridClass: buttonCount === 2 ? 'grid-cols-2' : 'grid-cols-3',
      containerClass: buttonCount === 2 ? (isMobile ? 'max-w-64' : 'max-w-80') : 'max-w-lg',
      buttonClass: 'justify-center' // 居中内容
    };
  };

  const layout = getGridLayout();

  // 如果没有任何购买链接，返回 null（隐藏组件）
  if (!layout) {
    return null;
  }

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
          
          return (
            <a
              key={button.label}
              href={button.href}
              target={button.isInternal ? '_self' : '_blank'}
              rel={button.isInternal ? undefined : 'noopener noreferrer'}
              className={cn(
                'flex items-center gap-2 py-3 px-4 rounded-full text-sm font-semibold',
                'border transition-all duration-200 relative min-h-[44px]',
                'hover:shadow-md active:scale-[0.98] active:duration-75',
                // 动态对齐方式
                layout.buttonClass,
                // 移动端优化 - 类似小红书的打开按钮
                isMobile ? [
                  'text-sm py-3',
                  buttons.length === 1 ? 'px-8' : 'px-4',
                  'shadow-sm'
                ] : [
                  'text-sm py-3',
                  buttons.length === 1 ? 'px-5' : 'px-4'
                ],
                // 购买链接样式 - 更突出的配色
                button.color || 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600'
              )}
            >
              <Icon className={cn(
                'flex-shrink-0',
                isMobile ? 'w-4 h-4' : 'w-4 h-4'
              )} />
              <span className={cn(
                'font-semibold',
                // 根据按钮数量调整文字显示
                isMobile && buttons.length === 3 ? 'text-xs' : 'whitespace-nowrap'
              )}>
                {button.label}
              </span>
            </a>
          );
        })}
      </div>
      
      {/* 购买链接提示信息 */}
      {buttons.length > 0 && (
        <div
          className={cn(
            'mt-1.5 flex flex-wrap items-start justify-between gap-1.5 text-xs',
            isMobile && 'flex-col items-start gap-1 text-[11px] leading-4'
          )}
        >
          <span className={cn('text-gray-400 opacity-75', isMobile && 'text-gray-500 opacity-90')}>
            点击查看商品详情页面
          </span>
          {chargeBaby.productSource && (
            <span
              className={cn(
                'inline-flex items-center gap-1',
                isMobile
                  ? 'text-[11px] leading-4 text-gray-600'
                  : 'text-sm text-gray-600'
              )}
            >
              <span>产品测试样机由</span>
              <span className="font-medium text-gray-600">{chargeBaby.productSource}</span>
              <span>提供</span>
              <Tooltip content={PRODUCT_SAMPLE_TOOLTIP} className={cn('-ml-1', isMobile && '-ml-0')} />
            </span>
          )}
        </div>
      )}
    </div>
  );
}
