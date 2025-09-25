'use client';

import { useEffect, useRef, useState } from 'react';

interface CapWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
  apiEndpoint?: string;
}

type CapSolveEvent = CustomEvent<{ token: string }>;

const DEFAULT_ENDPOINT = ensureTrailingSlash(
  process.env.NEXT_PUBLIC_CAP_API_ENDPOINT || '/api/cap/',
);

function ensureTrailingSlash(value: string) {
  if (!value) return '/api/cap/';
  return value.endsWith('/') ? value : `${value}/`;
}

export function CapWidget({ onVerify, onError, className, apiEndpoint }: CapWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const latestOnVerify = useRef(onVerify);
  const latestOnError = useRef(onError);

  useEffect(() => {
    latestOnVerify.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    latestOnError.current = onError;
  }, [onError]);

  useEffect(() => {
    let isCancelled = false;
    let widget: HTMLElement | null = null;

    setIsReady(false);

    const handleSolve = (event: Event) => {
      const customEvent = event as CapSolveEvent;
      const token = customEvent.detail?.token;
      if (token) {
        latestOnVerify.current?.(token);
      }
    };

    const handleError = () => {
      latestOnError.current?.();
    };

    const handleReset = () => {
      setIsReady(true);
    };

    const initialize = async () => {
      if (typeof window === 'undefined') return;

      try {
        if (!(window as any).Cap) {
          await import('@cap.js/widget');
        }

        if (isCancelled) return;

        widget = document.createElement('cap-widget');
        widget.setAttribute('data-cap-api-endpoint', ensureTrailingSlash(apiEndpoint ?? DEFAULT_ENDPOINT));
        widget.addEventListener('solve', handleSolve as EventListener);
        widget.addEventListener('error', handleError as EventListener);
        widget.addEventListener('reset', handleReset as EventListener);

        const container = containerRef.current;
        if (container) {
          container.replaceChildren(widget);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Cap widget initialization failed:', error);
        onError?.();
      }
    };

    initialize();

    return () => {
      isCancelled = true;
      if (widget) {
        widget.removeEventListener('solve', handleSolve as EventListener);
        widget.removeEventListener('error', handleError as EventListener);
        widget.removeEventListener('reset', handleReset as EventListener);
        widget.remove?.();
      }
    };
  }, [apiEndpoint]);

  return (
    <div className={className}>
      {!isReady && (
        <div className="w-80 h-16 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">正在加载验证组件...</span>
        </div>
      )}
      <div ref={containerRef} />
    </div>
  );
}
