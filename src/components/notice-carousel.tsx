'use client';

import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Notice } from '@/types/chargebaby';
import { NoticePreviewModal } from './notice-preview-modal';

interface NoticeCarouselProps {
  notices: Notice[];
  className?: string;
}

export function NoticeCarousel({ notices, className = '' }: NoticeCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 过滤掉隐藏的公告
  const visibleNotices = notices.filter(notice => !notice.hidden);

  // 自动轮播 - 5秒间隔
  useEffect(() => {
    if (visibleNotices.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % visibleNotices.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [visibleNotices.length]);

  // 如果没有公告，不显示组件
  if (visibleNotices.length === 0) {
    return null;
  }

  const currentNotice = visibleNotices[currentIndex];

  const handleNoticeClick = () => {
    setSelectedNotice(currentNotice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedNotice(null);
  };

  return (
    <>
      <div className={`text-center ${className}`}>
        <div
          className="inline-flex items-center justify-center cursor-pointer hover:text-gray-800 transition-colors"
          onClick={handleNoticeClick}
        >
          <span className="mr-2">📢</span>
          <span className="text-sm text-gray-600 truncate max-w-md">
            {currentNotice.title}
          </span>
          <span className="text-xs text-gray-400 ml-2 flex-shrink-0">
            ({currentIndex + 1}/{visibleNotices.length})
          </span>
          <ExternalLink className="w-3 h-3 ml-2 text-gray-400 flex-shrink-0" />
        </div>
      </div>

      {/* 预览弹窗 */}
      <NoticePreviewModal
        notice={selectedNotice}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </>
  );
}