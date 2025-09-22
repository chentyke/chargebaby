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
    <footer className="py-3 mt-auto bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 text-center">
        <a 
          href="http://beian.miit.gov.cn/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-gray-500 hover:text-gray-600 transition-colors"
        >
          浙ICP备2025199560号-1
        </a>
      </div>
    </footer>
  );
}