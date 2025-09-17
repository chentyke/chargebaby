import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'home';
  showIcon?: boolean;
}

export function BackButton({ 
  href, 
  onClick,
  children, 
  className,
  variant = 'default',
  showIcon = true 
}: BackButtonProps) {
  const Icon = variant === 'home' ? Home : ArrowLeft;
  
  const baseStyles = "inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer";
  
  const variantStyles = {
    default: "",
    compact: "px-4 py-2",
    home: "px-4 py-2 bg-white/70 hover:bg-white border border-gray-200 rounded-xl"
  };

  const content = (
    <>
      {showIcon && <Icon className="w-4 h-4 sm:w-5 sm:h-5" />}
      <span>{children}</span>
    </>
  );

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={cn(baseStyles, variantStyles[variant], className)}
      >
        {content}
      </button>
    );
  }

  if (href) {
    return (
      <Link 
        href={href}
        className={cn(baseStyles, variantStyles[variant], className)}
      >
        {content}
      </Link>
    );
  }

  return null;
}

interface PageHeaderProps {
  backButton?: {
    href: string;
    text: string;
    variant?: 'default' | 'compact' | 'home';
  };
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ 
  backButton, 
  title, 
  subtitle, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("mb-6 sm:mb-8", className)}>
      {/* 导航栏 */}
      {(backButton || actions) && (
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          {backButton && (
            <BackButton 
              href={backButton.href} 
              variant={backButton.variant}
            >
              {backButton.text}
            </BackButton>
          )}
          {actions && <div className="flex items-center gap-3">{actions}</div>}
        </div>
      )}
      
      {/* 标题区域 */}
      {(title || subtitle) && (
        <div>
          {title && (
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-gray-600">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}