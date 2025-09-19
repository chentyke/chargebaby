'use client';

export function Footer() {
  // Check if domain is chargedb.cn
  const shouldShowICP = typeof window !== 'undefined' 
    ? window.location.hostname === 'chargedb.cn'
    : process.env.NEXT_PUBLIC_APP_URL?.includes('chargedb.cn');

  if (!shouldShowICP) {
    return null;
  }

  return (
    <footer className="py-8 mt-16">
      <div className="container mx-auto px-4 text-center">
        <a 
          href="http://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-gray-500 transition-colors opacity-70"
        >
          浙ICP备2025199560号-1
        </a>
      </div>
    </footer>
  );
}