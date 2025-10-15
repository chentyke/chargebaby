'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { BatteryCharging, Cable, Zap, ChevronUp, Menu } from 'lucide-react';

interface SiteSwitcherProps {
  currentSite?: 'powerbank' | 'cable' | 'charger';
}

interface SiteConfig {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
}

const sites: SiteConfig[] = [
  {
    name: '充电宝',
    href: '/',
    icon: BatteryCharging,
    iconColor: 'text-amber-500',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-600'
  },
  {
    name: '数据线',
    href: '/cable',
    icon: Cable,
    iconColor: 'text-blue-500',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-600'
  },
  {
    name: '充电器',
    href: '/charger',
    icon: Zap,
    iconColor: 'text-orange-500',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-red-600'
  }
];

export function SiteSwitcher({ currentSite }: SiteSwitcherProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 根据当前路径自动检测当前站点
  const getCurrentSite = (): 'powerbank' | 'cable' | 'charger' => {
    if (currentSite) return currentSite;

    if (pathname === '/') return 'powerbank';
    if (pathname.startsWith('/cable')) return 'cable';
    if (pathname.startsWith('/charger')) return 'charger';
    return 'powerbank';
  };

  const activeSite = getCurrentSite();
  const activeIndex = sites.findIndex(site => {
    if (activeSite === 'powerbank') return site.href === '/';
    if (activeSite === 'cable') return site.href === '/cable';
    if (activeSite === 'charger') return site.href === '/charger';
    return false;
  });

  const currentSiteConfig = sites[activeIndex];
  const CurrentIcon = currentSiteConfig.icon;

  // 点击外部关闭下拉菜单
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsExpanded(false);
      }
    }

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  return (
    <div
      className="px-4 sm:px-0 sm:absolute sm:top-0 sm:left-0 z-50"
      style={{
        paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 1rem)',
        paddingRight: 'calc(env(safe-area-inset-right, 0px) + 1rem)'
      }}
    >
      <div className="mb-6 sm:mb-0 sm:ml-4 sm:mt-4">
        {/* 移动端：小按钮 + 下拉菜单 */}
        <div className="sm:hidden relative" ref={dropdownRef}>
          {/* 小按钮 */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/80 backdrop-blur-md border border-white/40 shadow-sm hover:shadow-md transition-all duration-200"
            aria-label="切换站点"
          >
            <div className={`p-1 rounded ${currentSiteConfig.gradientFrom} ${currentSiteConfig.gradientTo} bg-gradient-to-r text-white`}>
              <CurrentIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-medium text-gray-700">{currentSiteConfig.name}</span>
            <ChevronUp
              className={`w-3.5 h-3.5 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>

          {/* 下拉菜单 */}
          <div className={`
            absolute top-full left-0 mt-2 w-48 rounded-xl bg-white/95 backdrop-blur-lg border border-white/40 shadow-xl overflow-hidden
            transition-all duration-200 origin-top-left
            ${isExpanded ? 'opacity-100 scale-100 visible' : 'opacity-0 scale-95 invisible'}
          `}>
            <div className="py-1">
              {sites.map((site, index) => {
                const Icon = site.icon;
                const isActive = index === activeIndex;

                return (
                  <Link
                    key={site.name}
                    href={site.href}
                    onClick={() => setIsExpanded(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150
                      ${isActive
                        ? `bg-gradient-to-r ${site.gradientFrom} ${site.gradientTo} text-white`
                        : 'text-gray-700 hover:bg-gray-50'
                      }
                    `}
                  >
                    <Icon className={`
                      w-4 h-4
                      ${isActive ? 'text-white' : site.iconColor}
                    `} />
                    <span className={`
                      font-medium
                      ${isActive ? 'text-white' : 'text-gray-700'}
                    `}>
                      {site.name}
                    </span>
                    {isActive && (
                      <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* 桌面端：水平排列的分段控制器样式 */}
        <div className="hidden sm:flex items-center gap-1 p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg">
          {sites.map((site, index) => {
            const Icon = site.icon;
            const isActive = index === activeIndex;

            return (
              <Link
                key={site.name}
                href={site.href}
                aria-label={`切换到${site.name}版`}
                className={`
                  relative inline-flex items-center gap-2 px-4 py-2.5 rounded-xl
                  transition-all duration-300 ease-out group
                  ${isActive
                    ? `bg-gradient-to-r ${site.gradientFrom} ${site.gradientTo} text-white shadow-md transform scale-105`
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }
                `}
              >
                {/* 图标 */}
                <Icon className={`
                  w-4 h-4 transition-all duration-300
                  ${isActive ? 'text-white' : site.iconColor}
                `} />

                {/* 文字 */}
                <span className={`
                  text-sm font-medium transition-all duration-300
                  ${isActive ? 'text-white' : ''}
                `}>
                  {site.name}
                </span>

                {/* 激活状态的光晕效果 */}
                {isActive && (
                  <div className={`
                    absolute inset-0 rounded-xl bg-gradient-to-r ${site.gradientFrom} ${site.gradientTo} opacity-20 blur-md -z-10
                  `} />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}