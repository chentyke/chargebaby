'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState, useRef, useEffect } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
}

export function TurnstileWidget({ onVerify, onError, className }: TurnstileWidgetProps) {
  const [isVerified, setIsVerified] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const turnstileRef = useRef<any>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleVerify = (token: string) => {
    setIsVerified(true);
    onVerify(token);
  };

  const handleError = () => {
    setIsVerified(false);
    onError?.();
  };

  const handleExpire = () => {
    setIsVerified(false);
  };

  // 只在客户端挂载后渲染 Turnstile 组件
  if (!isMounted) {
    return (
      <div className={className}>
        <div className="w-80 h-16 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <span className="text-gray-500 text-sm">正在加载验证组件...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        ref={turnstileRef}
        siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
        onSuccess={handleVerify}
        onError={handleError}
        onExpire={handleExpire}
        options={{
          theme: 'light',
          size: 'normal',
        }}
      />
    </div>
  );
}