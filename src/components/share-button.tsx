'use client';

import { Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  showText?: boolean;
}

export function ShareButton({ 
  title, 
  text, 
  url, 
  className,
  showText = true 
}: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title,
      text: text || title,
      url: url || window.location.href,
    };

    // 检查是否支持 Web Share API
    const canUseWebShare = typeof navigator !== 'undefined' && 
                          navigator.share && 
                          typeof navigator.share === 'function' &&
                          (!navigator.canShare || navigator.canShare(shareData));
    
    if (canUseWebShare) {
      try {
        setIsSharing(true);
        await navigator.share(shareData);
      } catch (error: any) {
        // 用户取消分享或其他错误
        if (error?.name !== 'AbortError') {
          console.error('Web Share API 分享失败:', error);
          fallbackShare(shareData);
        }
      } finally {
        setIsSharing(false);
      }
    } else {
      // 降级到其他分享方式
      console.log('Web Share API 不支持，使用降级方案');
      fallbackShare(shareData);
    }
  };

  const fallbackShare = (shareData: { title: string; text: string; url: string }) => {
    // 创建分享文本，包含完整信息
    const shareText = `${shareData.title}\n\n${shareData.text}\n\n${shareData.url}`;
    
    // 检查剪贴板API是否可用（需要HTTPS环境）
    const canUseClipboard = typeof navigator !== 'undefined' && 
                           navigator.clipboard && 
                           typeof navigator.clipboard.writeText === 'function' &&
                           window.location.protocol === 'https:';
    
    if (canUseClipboard) {
      // 使用现代剪贴板API
      navigator.clipboard.writeText(shareText).then(() => {
        alert('分享内容已复制到剪贴板，你可以粘贴到任何地方分享');
      }).catch((err) => {
        console.error('剪贴板API失败:', err);
        // 剪贴板API失败，降级到传统方法
        fallbackCopyMethod(shareText, shareData.url);
      });
    } else {
      // 直接使用传统方法
      console.log('剪贴板API不可用，使用传统复制方法');
      fallbackCopyMethod(shareText, shareData.url);
    }
  };

  const fallbackCopyMethod = (shareText: string, url: string) => {
    try {
      // 创建临时文本区域
      const textArea = document.createElement('textarea');
      textArea.value = shareText;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      // 尝试复制
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        alert('分享内容已复制到剪贴板，你可以粘贴到任何地方分享');
      } else {
        throw new Error('document.execCommand failed');
      }
    } catch (err) {
      console.error('复制失败:', err);
      // 最终降级方案：显示分享内容让用户手动复制
      showShareContent(shareText);
    }
  };

  const showShareContent = (shareText: string) => {
    // 创建一个简单的模态框显示分享内容
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      padding: 20px;
      box-sizing: border-box;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 500px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
    `;
    
    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: bold;">分享内容</h3>
      <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">请手动复制以下内容进行分享：</p>
      <textarea readonly style="width: 100%; height: 200px; padding: 12px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; font-size: 14px; resize: vertical;">${shareText}</textarea>
      <div style="margin-top: 16px; text-align: right;">
        <button id="closeModal" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">关闭</button>
      </div>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // 选中文本内容
    const textarea = content.querySelector('textarea') as HTMLTextAreaElement;
    textarea.select();
    textarea.setSelectionRange(0, 99999); // 移动设备兼容
    
    // 关闭按钮事件
    const closeBtn = content.querySelector('#closeModal') as HTMLButtonElement;
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  };

  return (
    <button
      onClick={handleShare}
      disabled={isSharing}
      className={cn(
        'inline-flex items-center gap-2 text-gray-600 hover:text-gray-900',
        'transition-colors duration-200',
        isSharing && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={showText ? undefined : '分享'}
    >
      <Share2 className={cn(
        'w-5 h-5 transition-transform duration-200',
        isSharing && 'animate-pulse'
      )} />
      {showText && (
        <span className="text-sm font-medium">
          {isSharing ? '分享中...' : '分享'}
        </span>
      )}
    </button>
  );
}