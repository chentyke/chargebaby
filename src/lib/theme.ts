export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'theme-preference';

const DOCS_PREFIX = '/docs';

function normalizePathname(pathname: string | null | undefined): string {
  if (!pathname) {
    return '';
  }
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.length > 0 ? trimmed : '/';
}

export function isDocsPath(pathname: string | null | undefined): boolean {
  const normalized = normalizePathname(pathname);
  if (!normalized) {
    return false;
  }
  if (normalized === DOCS_PREFIX) {
    return true;
  }
  return normalized.startsWith(`${DOCS_PREFIX}/`);
}

export function readStoredPreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }
  const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  return 'system';
}

export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }
  if (typeof window === 'undefined') {
    return 'light';
  }
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  return media.matches ? 'dark' : 'light';
}
