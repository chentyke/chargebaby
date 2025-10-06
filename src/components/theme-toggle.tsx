'use client';

import { useCallback, useEffect, useState } from 'react';
import { Moon, Sun, Laptop } from 'lucide-react';
import { cn } from '@/lib/utils';
import { THEME_STORAGE_KEY, ThemePreference, isDocsPath, readStoredPreference, resolveTheme } from '@/lib/theme';

export function ThemeToggle({ className, size = 'md' }: { className?: string; size?: 'sm' | 'md' }) {
  const [mounted, setMounted] = useState(false);
  const [preference, setPreference] = useState<ThemePreference>('system');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const applyTheme = useCallback((pref: ThemePreference) => {
    if (typeof window === 'undefined') {
      return;
    }
    let resolved = resolveTheme(pref);
    if (!isDocsPath(window.location.pathname)) {
      resolved = 'light';
    }
    const root = document.documentElement;

    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = resolved;

    setResolvedTheme(resolved);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    setPreference(readStoredPreference());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') {
      return;
    }

    applyTheme(preference);

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      if (preference === 'system') {
        let resolved = event.matches ? 'dark' : 'light';
        if (!isDocsPath(window.location.pathname)) {
          resolved = 'light';
        }
        const root = document.documentElement;
        root.classList.toggle('dark', resolved === 'dark');
        root.dataset.theme = resolved;
        setResolvedTheme(resolved);
      }
    };

    if (preference === 'system') {
      if (media.addEventListener) {
        media.addEventListener('change', handleChange);
      } else {
        // @ts-ignore deprecated
        media.addListener(handleChange);
      }
      return () => {
        if (media.removeEventListener) {
          media.removeEventListener('change', handleChange);
        } else {
          // @ts-ignore deprecated
          media.removeListener(handleChange);
        }
      };
    }
  }, [applyTheme, mounted, preference]);

  useEffect(() => {
    if (!mounted) {
      return;
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  }, [mounted, preference]);

  const cycleTheme = () => {
    setPreference(prev => {
      if (prev === 'system') return 'light';
      if (prev === 'light') return 'dark';
      return 'system';
    });
  };

  if (!mounted) {
    return null;
  }

  const icon = preference === 'system'
    ? <Laptop className="h-4 w-4" />
    : resolvedTheme === 'dark'
      ? <Moon className="h-4 w-4" />
      : <Sun className="h-4 w-4" />;

  const sizeClasses = size === 'sm'
    ? 'h-8 w-8 text-sm'
    : 'h-9 w-9 text-base';

  const nextLabel = preference === 'system'
    ? '切换到亮色模式'
    : preference === 'light'
      ? '切换到暗色模式'
      : '切换到系统模式';

  return (
    <button
      type="button"
      className={cn(
        'theme-toggle-button inline-flex items-center justify-center text-gray-700 transition-colors hover:text-blue-500 focus-visible:outline-none dark:text-slate-200 dark:hover:text-blue-400',
        sizeClasses,
        className
      )}
      onClick={cycleTheme}
      aria-label={`当前主题：${preference === 'system' ? '跟随系统' : preference === 'light' ? '亮色' : '暗色'}，${nextLabel}`}
      title={`当前：${preference === 'system' ? '跟随系统' : preference === 'light' ? '亮色模式' : '暗色模式'}。点击切换`}
    >
      {icon}
    </button>
  );
}
