'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isDocsPath, readStoredPreference, resolveTheme } from '@/lib/theme';

export function ThemeGuard() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;
    const onDocsPage = isDocsPath(pathname);

    if (!onDocsPage) {
      root.classList.remove('dark');
      root.dataset.theme = 'light';
      return;
    }

    const preference = readStoredPreference();
    const resolved = resolveTheme(preference);

    root.classList.toggle('dark', resolved === 'dark');
    root.dataset.theme = resolved;
  }, [pathname]);

  return null;
}
