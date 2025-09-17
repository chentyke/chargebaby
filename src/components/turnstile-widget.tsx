'use client';

import { Turnstile } from '@marsidev/react-turnstile';
import { useState, useRef } from 'react';

interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onError?: () => void;
  className?: string;
}

export function TurnstileWidget({ onVerify, onError, className }: TurnstileWidgetProps) {
  const [isVerified, setIsVerified] = useState(false);
  const turnstileRef = useRef<any>(null);

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