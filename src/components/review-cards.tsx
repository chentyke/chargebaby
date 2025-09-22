'use client';

import { SubProject } from '@/types/chargebaby';
import { Play, FileText, ExternalLink, Calendar, User, Plus, Minus, X, Mail, Send, Edit3, Trash2 } from 'lucide-react';
import { NotionImage } from './notion-image';
import { formatDate } from '@/lib/utils';
import { useRef, useEffect, useState } from 'react';
import { TurnstileWidget } from './turnstile-widget';
import { ImageUpload } from './image-upload';

interface ReviewCardsProps {
  subProjects: SubProject[] | undefined;
  modelName: string; // 用于投稿时关联到具体产品
}

export function ReviewCards({ subProjects, modelName }: ReviewCardsProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
    return <EmptyReviewsComponent modelName={modelName} />;
  }

  return (
    <div className="space-y-4">
      {/* 标题和添加/删除按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">相关评测</h3>
          <p className="text-xs text-gray-500 mt-1">以下内容收集自互联网，本站不保证内容真实可靠，请注意甄别。</p>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-sm"
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">管理评测</span>
          <span className="sm:hidden">管理</span>
        </button>
      </div>
      
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

      {/* 管理评测弹窗 */}
      {mounted && showManageModal && (
        <ReviewManageModal 
          modelName={modelName}
          onClose={() => setShowManageModal(false)}
        />
      )}
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

// 投稿表单接口
interface ReviewSubmissionData {
  model: string;
  author: string;
  link: string;
  date: string;
  cover: string;
  type: string;
  title: string;
}

// 上传图片到Notion的函数
async function uploadImageToNotion(file: File, turnstileToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('turnstileToken', turnstileToken);

  const response = await fetch('/api/upload-image', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const result = await response.json();
    throw new Error(result.error || '图片上传失败');
  }

  const result = await response.json();
  return result.url;
}

interface ReviewManageModalProps {
  modelName: string;
  onClose: () => void;
}

function ReviewManageModal({ modelName, onClose }: ReviewManageModalProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'delete'>('submit');
  const [formData, setFormData] = useState<ReviewSubmissionData>({
    model: `${modelName}`,
    author: '',
    link: '',
    date: '',
    cover: '',
    type: '视频',
    title: ''
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // 防止背景滚动和键盘导航
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage('投稿成功！感谢您的投稿，我们会尽快审核。');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        setSubmitMessage('投稿失败，请稍后重试。');
      }
    } catch (error) {
      setSubmitMessage('网络错误，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg max-h-[95vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 shadow-xl">
        {/* 弹窗标题 */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
          <h4 className="text-lg sm:text-xl font-semibold text-gray-900">管理评测内容</h4>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-95 ${
              activeTab === 'submit'
                ? 'text-blue-600 bg-white border-b-2 border-blue-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">投稿评测</span>
              <span className="sm:hidden">投稿</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-95 ${
              activeTab === 'delete'
                ? 'text-red-600 bg-white border-b-2 border-red-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">删除内容</span>
              <span className="sm:hidden">删除</span>
            </div>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'submit' ? (
            <SubmissionTab 
              modelName={modelName}
              formData={formData}
              setFormData={setFormData}
              selectedImageFile={selectedImageFile}
              setSelectedImageFile={setSelectedImageFile}
              isSubmitting={isSubmitting}
              setIsSubmitting={setIsSubmitting}
              submitMessage={submitMessage}
              setSubmitMessage={setSubmitMessage}
              turnstileToken={turnstileToken}
              setTurnstileToken={setTurnstileToken}
              onClose={onClose}
            />
          ) : (
            <DeleteTab onClose={onClose} />
          )}
        </div>
      </div>
    </div>
  );
}

// 投稿标签页组件
interface SubmissionTabProps {
  modelName: string;
  formData: ReviewSubmissionData;
  setFormData: React.Dispatch<React.SetStateAction<ReviewSubmissionData>>;
  selectedImageFile: File | null;
  setSelectedImageFile: (file: File | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (loading: boolean) => void;
  submitMessage: string;
  setSubmitMessage: (message: string) => void;
  onClose: () => void;
  turnstileToken: string | null;
  setTurnstileToken: (token: string | null) => void;
}

function SubmissionTab({ 
  modelName, 
  formData, 
  setFormData, 
  selectedImageFile,
  setSelectedImageFile,
  isSubmitting, 
  setIsSubmitting, 
  submitMessage, 
  setSubmitMessage, 
  turnstileToken,
  setTurnstileToken,
  onClose 
}: SubmissionTabProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 检查Turnstile验证
    if (!turnstileToken) {
      setSubmitMessage('请完成人机验证后再提交。');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      let finalFormData = { ...formData };

      // 如果有选择的图片文件，先上传图片
      if (selectedImageFile && turnstileToken) {
        setSubmitMessage('正在上传图片...');
        try {
          const imageUrl = await uploadImageToNotion(selectedImageFile, turnstileToken);
          finalFormData.cover = imageUrl;
          setSubmitMessage('图片上传成功，正在提交表单...');
        } catch (imageError) {
          throw new Error(`图片上传失败: ${imageError instanceof Error ? imageError.message : '未知错误'}`);
        }
      }

      const response = await fetch('/api/submit-review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...finalFormData,
          turnstileToken
        }),
      });

      if (response.ok) {
        setSubmitMessage('投稿成功！感谢您的投稿，我们会尽快审核。');
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        setSubmitMessage(errorData.error || '投稿失败，请稍后重试。');
      }
    } catch (error) {
      setSubmitMessage(error instanceof Error ? error.message : '网络错误，请稍后重试。');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-hidden">
      {/* 说明文字 */}
      <div className="text-sm text-gray-600 leading-relaxed bg-blue-50 p-3 rounded-md">
        感谢您投稿评测内容！投稿的内容会进入审核流程，审核通过后将显示在评测列表中。
      </div>

      {/* 关联产品 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          关联产品
        </label>
        <input
          type="text"
          value={formData.model}
          readOnly
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-gray-50 text-gray-600 text-sm min-w-0 max-w-full box-border"
        />
      </div>

      {/* 评测类型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          评测类型 <span className="text-red-500">*</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 max-w-full box-border"
        >
          <option value="视频">视频评测</option>
          <option value="图文">图文评测</option>
        </select>
      </div>

      {/* 评测标题 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          评测标题 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          placeholder="请输入评测标题"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 max-w-full box-border"
        />
      </div>

      {/* 作者 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          作者/UP主 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="author"
          value={formData.author}
          onChange={handleInputChange}
          placeholder="请输入作者名称"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 max-w-full box-border"
        />
      </div>

      {/* 评测链接 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          评测链接 <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          name="link"
          value={formData.link}
          onChange={handleInputChange}
          placeholder="请输入完整的评测链接"
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 max-w-full box-border"
        />
      </div>

      {/* 发布日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          发布日期 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleInputChange}
          required
          className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 max-w-full box-border"
        />
      </div>

      {/* 封面图片 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          封面图片
        </label>
        <ImageUpload
          onFileSelect={setSelectedImageFile}
          onUploadError={(error) => {
            setSubmitMessage(`图片选择失败: ${error}`);
          }}
          currentImageUrl={formData.cover}
          maxSize={20 * 1024 * 1024} // 20MB
          acceptedTypes={['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']}
          disabled={isSubmitting}
          className="mb-2"
        />
        <p className="text-xs text-gray-500">
          支持选择 JPG、PNG、WebP、GIF 格式的图片，最大 20MB。提交时将自动上传（可选）
        </p>
      </div>

      {/* Turnstile人机验证 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          人机验证 <span className="text-red-500">*</span>
        </label>
        <TurnstileWidget
          onVerify={setTurnstileToken}
          onError={() => {
            setTurnstileToken(null);
            setSubmitMessage('人机验证失败，请重试');
          }}
          className="flex justify-center"
        />
        {!turnstileToken && (
          <p className="text-xs text-gray-500 mt-1">请完成人机验证</p>
        )}
      </div>

      {/* 提交状态消息 */}
      {submitMessage && (
        <div className={`text-sm p-3 rounded-md ${
          submitMessage.includes('成功') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {submitMessage}
        </div>
      )}

      {/* 按钮组 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || !turnstileToken}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all duration-200 font-medium shadow-sm active:scale-95 min-h-[44px]"
        >
          <Send className="w-4 h-4" />
          {isSubmitting ? '提交中...' : !turnstileToken ? '请先完成验证' : '提交投稿'}
        </button>
        <button
          type="button"
          onClick={onClose}
          disabled={isSubmitting}
          className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:bg-gray-100 transition-all duration-200 font-medium active:scale-95 min-h-[44px]"
        >
          取消
        </button>
      </div>
    </form>
  );
}

// 删除标签页组件
interface DeleteTabProps {
  onClose: () => void;
}

function DeleteTab({ onClose }: DeleteTabProps) {
  return (
    <div className="p-4 sm:p-6 space-y-4">
      {/* 说明文字 */}
      <div className="text-sm text-gray-600 leading-relaxed bg-red-50 p-3 rounded-md">
        如果您是评测作者，想要将评测从本版块移除，请联系网站管理员。
      </div>

      {/* 联系方式 */}
      <div>
        <h5 className="text-sm font-medium text-gray-700 mb-3">联系方式</h5>
        <div className="bg-gray-50 p-4 rounded-md space-y-3">
          <div>
            <div className="text-xs text-gray-500 mb-1">管理员邮箱</div>
            <div className="text-gray-900 font-medium">y.nw@qq.com</div>
          </div>
          
          <div className="text-xs text-gray-500">
            发送邮件时请详细描述您的需求，包括：
            <ul className="mt-1 ml-4 list-disc space-y-0.5">
              <li>需要删除的评测链接</li>
              <li>您的身份证明（如作者账号）</li>
              <li>删除原因</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 按钮组 */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          onClick={() => {
            window.open('mailto:y.nw@qq.com?subject=删除评测内容申请&body=您好，我想要申请删除评测内容：%0A%0A评测链接：%0A身份证明：%0A删除原因：%0A%0A请在此处提供详细信息...', '_blank');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all duration-200 font-medium shadow-sm active:scale-95 min-h-[44px]"
        >
          <Mail className="w-4 h-4" />
          发送删除申请
        </button>
        <button
          onClick={onClose}
          className="px-4 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200 font-medium active:scale-95 min-h-[44px]"
        >
          取消
        </button>
      </div>
    </div>
  );
}

// 空状态组件 - 没有评测时显示
interface EmptyReviewsComponentProps {
  modelName: string;
}

function EmptyReviewsComponent({ modelName }: EmptyReviewsComponentProps) {
  const [showManageModal, setShowManageModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="space-y-4">
      {/* 标题和投稿按钮 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">相关评测</h3>
          <p className="text-xs text-gray-500 mt-1">暂无相关评测内容，欢迎您来投稿第一个评测！</p>
        </div>
        <button
          onClick={() => setShowManageModal(true)}
          className="px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 hover:border-blue-400 rounded-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 hover:shadow-sm"
        >
          <Plus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">投稿评测</span>
          <span className="sm:hidden">投稿</span>
        </button>
      </div>

      {/* 管理评测弹窗 */}
      {mounted && showManageModal && (
        <ReviewManageModal 
          modelName={modelName}
          onClose={() => setShowManageModal(false)}
        />
      )}
    </div>
  );
}