import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { NotionImage } from '@/components/notion-image';
import { getChargeBabyByModel } from '@/lib/notion';

export default async function WeChatPage() {
  const chargeBaby = await getChargeBabyByModel('WeChat');

  if (!chargeBaby || !chargeBaby.imageUrl) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative flex flex-col">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      
      {/* 返回按钮 */}
      <div className="relative p-6">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span>返回</span>
        </Link>
      </div>
      
      {/* 微信群组图片 */}
      <div className="flex-1 flex items-center justify-center p-6 pt-0">
        <div className="relative w-full max-w-2xl mx-auto">
          <NotionImage
            src={chargeBaby.imageUrl}
            alt="微信群组"
            width={800}
            height={800}
            className="object-contain w-full h-auto"
            sizes="(max-width: 768px) 100vw, 800px"
            priority
          />
        </div>
      </div>
    </div>
  );
}