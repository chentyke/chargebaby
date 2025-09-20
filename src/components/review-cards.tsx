'use client';

import { SubProject } from '@/types/chargebaby';
import { Play, FileText, ExternalLink, Calendar, User } from 'lucide-react';
import { NotionImage } from './notion-image';
import { formatDate } from '@/lib/utils';
import { useRef, useEffect } from 'react';

interface ReviewCardsProps {
  subProjects: SubProject[];
}

export function ReviewCards({ subProjects }: ReviewCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let scrollTimeout: NodeJS.Timeout;

    const handleScroll = () => {
      container.classList.add('scrolling');
      
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        container.classList.remove('scrolling');
      }, 1000);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);

  if (!subProjects || subProjects.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">线上评测</h3>
      
      {/* 横向滑动容器 */}
      <div 
        ref={scrollContainerRef}
        className="overflow-x-auto scrollbar-on-scroll"
      >
        <div className="flex gap-3 pb-4">
          {subProjects.map((project, index) => (
            <ReviewCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ReviewCardProps {
  project: SubProject;
  index: number;
}

function ReviewCard({ project, index }: ReviewCardProps) {
  const isVideo = project.type.includes('视频');
  const isArticle = project.type.includes('图文');
  
  // 提取评测标题（去掉前缀）
  const reviewTitle = project.model
    ?.replace('视频评测-', '')
    ?.replace('图文拆解 -', '')
    ?.replace(/《|》/g, '') || '评测内容';

  // 处理链接
  const handleClick = () => {
    if (project.videoLink) {
      let url = project.videoLink;
      // 确保URL有协议
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="flex-shrink-0 w-56 bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer group transition-all duration-300 hover:border-gray-300"
      onClick={handleClick}
      style={{
        animationDelay: `${index * 100}ms`,
        animation: 'slideIn 0.5s ease-out forwards',
        opacity: 0
      }}
    >
      {/* 封面图片 */}
      {project.videoCover && (
        <div className="relative aspect-video bg-gray-50">
          <NotionImage
            src={project.videoCover}
            alt={reviewTitle}
            fill
            className="w-full h-full object-cover object-center"
            sizes="224px"
          />
          {/* 播放按钮覆盖层（仅视频） */}
          {isVideo && (
            <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
              <div className="w-10 h-10 bg-white/95 rounded-full flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-800 ml-0.5" fill="currentColor" />
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 内容 */}
      <div className="p-4 space-y-3">
        {/* 类型标识和外部链接 */}
        <div className="flex items-center justify-between">
          {isVideo ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-red-50 text-red-600 rounded text-xs font-medium">
              <Play className="w-3 h-3" />
              视频评测
            </div>
          ) : isArticle ? (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-medium">
              <FileText className="w-3 h-3" />
              图文评测
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
              <FileText className="w-3 h-3" />
              评测内容
            </div>
          )}
          
          <ExternalLink className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* 标题 */}
        <h4 className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">
          {reviewTitle}
        </h4>
        
        {/* 作者和日期 */}
        <div className="space-y-1 text-xs text-gray-500">
          {project.videoAuthor && (
            <div className="flex items-center gap-1.5">
              <User className="w-3 h-3" />
              <span>{project.videoAuthor}</span>
            </div>
          )}
          {project.videoDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(project.videoDate)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}