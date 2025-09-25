'use client';

interface RetryButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function RetryButton({ children, className = '' }: RetryButtonProps) {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <button 
      onClick={handleRetry}
      className={className}
    >
      {children}
    </button>
  );
}