'use client';

import { useState } from 'react';
import { Send, Image, X } from 'lucide-react';
import NextImage from 'next/image';
import { CapWidget } from './cap-widget';

interface FeedbackData {
  title: string;
  type: 'website_design' | 'data_error' | 'feature_request' | 'other' | '';
  description: string;
  contact: string;
  images: File[];
}

interface SelectedImage {
  file: File;
  previewUrl: string;
  uploading: boolean;
  uploadedUrl?: string;
  error?: string;
}

const feedbackTypes = [
  { value: 'website_design', label: '网站设计' },
  { value: 'data_error', label: '数据错误' },
  { value: 'feature_request', label: '功能请求' },
  { value: 'other', label: '其他问题' },
];

export function FeedbackForm() {
  const [formData, setFormData] = useState<FeedbackData>({
    title: '',
    type: '',
    description: '',
    contact: '',
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [capToken, setCapToken] = useState<string>('');

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = '请输入反馈标题';
    }
    
    if (!formData.type) {
      newErrors.type = '请选择反馈类型';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = '请描述具体的反馈内容';
    }

    if (formData.contact && !isValidContact(formData.contact)) {
      newErrors.contact = '请输入有效的联系方式（邮箱或微信号）';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidContact = (contact: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const wechatRegex = /^[a-zA-Z][a-zA-Z0-9_-]{5,19}$/;
    return emailRegex.test(contact) || wechatRegex.test(contact) || contact.includes('微信') || contact.includes('手机');
  };

  const uploadImageToServer = async (file: File, capToken: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('capToken', capToken);
    
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '图片上传失败');
    }

    const result = await response.json();
    return result.url;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      // 验证文件
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      const maxSize = 20 * 1024 * 1024; // 20MB
      
      if (!validTypes.includes(file.type)) {
        alert(`文件 "${file.name}" 格式不支持，请选择 JPG、PNG、WebP 或 GIF 格式的图片`);
        continue;
      }
      
      if (file.size > maxSize) {
        alert(`文件 "${file.name}" 过大，请选择小于 20MB 的图片`);
        continue;
      }

      // 检查是否已达到最大数量
      if (selectedImages.length >= 3) {
        alert('最多只能选择 3 张图片');
        break;
      }

      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      
      // 添加到选择列表（不立即上传）
      const newImage: SelectedImage = {
        file,
        previewUrl,
        uploading: false,
      };

      setSelectedImages(prev => [...prev, newImage]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, file]
      }));
    }
    
    // 清空input，允许重复选择同一文件
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const imageToRemove = selectedImages[index];
    
    // 释放预览URL内存
    if (imageToRemove.previewUrl) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove.file)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // 检查 Cap 验证
    if (!capToken) {
      setSubmitError('请先完成人机验证');
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      // 1. 先上传所有图片
      const imageUrls: string[] = [];
      
      if (selectedImages.length > 0) {
        // 更新图片上传状态
        setSelectedImages(prev => prev.map(img => ({ ...img, uploading: true, error: undefined })));
        
        for (let i = 0; i < selectedImages.length; i++) {
          const selectedImage = selectedImages[i];
          
          try {
            const url = await uploadImageToServer(selectedImage.file, capToken);
            imageUrls.push(url);
            
            // 更新单个图片状态
            setSelectedImages(prev => prev.map((img, index) => 
              index === i ? { ...img, uploading: false, uploadedUrl: url } : img
            ));
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '图片上传失败';
            
            // 更新单个图片错误状态
            setSelectedImages(prev => prev.map((img, index) => 
              index === i ? { ...img, uploading: false, error: errorMessage } : img
            ));
            
            throw new Error(`图片 "${selectedImage.file.name}" 上传失败: ${errorMessage}`);
          }
        }
      }

      // 2. 提交反馈数据
      const submitData = {
        title: formData.title,
        type: formData.type,
        description: formData.description,
        contact: formData.contact,
        imageUrls: imageUrls,
      };

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        
        // 清理数据和预览URL
        selectedImages.forEach(img => {
          if (img.previewUrl) {
            URL.revokeObjectURL(img.previewUrl);
          }
        });
        
        setFormData({
          title: '',
          type: '',
          description: '',
          contact: '',
          images: [],
        });
        setSelectedImages([]);
        setErrors({});
        setCapToken(''); // 重置验证token
      } else {
        setSubmitStatus('error');
        setSubmitError(result.error || '提交失败，请稍后重试');
      }
    } catch (error) {
      setSubmitStatus('error');
      const errorMessage = error instanceof Error ? error.message : '网络错误，请检查网络连接后重试';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInputClassName = (fieldName: string) => {
    return `w-full rounded-2xl border px-4 py-3 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-slate-400 ${
      errors[fieldName]
        ? 'border-red-300 bg-white text-slate-900'
        : 'border-slate-200/70 bg-white/80 text-slate-900'
    }`;
  };

  const renderError = (fieldName: string) => {
    if (errors[fieldName]) {
      return (
        <div className="text-red-500 text-xs mt-1">
          {errors[fieldName]}
        </div>
      );
    }
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl space-y-10 px-4 sm:px-6">
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900 sm:text-3xl">用户反馈</h1>
        <p className="text-sm text-slate-600">请尽量完整描述问题或建议，方便我们快速定位与跟进。</p>
      </div>

      <div className="space-y-10">
        {/* 反馈标题 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            反馈标题 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className={getInputClassName('title')}
            placeholder="简单描述您的反馈内容"
            required
          />
          {renderError('title')}
        </div>

        {/* 反馈类型 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            反馈类型 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {feedbackTypes.map((type) => (
              <label
                key={type.value}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-all ${
                  formData.type === type.value
                    ? 'border-slate-900 bg-slate-900 text-white shadow-[0_18px_50px_-30px_rgba(15,23,42,0.65)]'
                    : 'border-slate-200/70 bg-white/80 text-slate-700 hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as FeedbackData['type'] }))}
                  className="sr-only"
                />
                <span>{type.label}</span>
                </label>
            ))}
          </div>
          {renderError('type')}
        </div>

        {/* 详细描述 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            详细描述 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className={getInputClassName('description')}
            rows={6}
            placeholder="请详细描述您遇到的问题、建议或想法..."
            required
          />
          {renderError('description')}
        </div>

        {/* 联系方式 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            联系方式
            <span className="ml-1 text-xs text-slate-500">（可选，方便我们与您联系）</span>
          </label>
          <input
            type="text"
            value={formData.contact}
            onChange={(e) => setFormData(prev => ({ ...prev, contact: e.target.value }))}
            className={getInputClassName('contact')}
            placeholder="邮箱、微信号或其他联系方式"
          />
          {renderError('contact')}
        </div>

        {/* 图片上传 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            相关图片
            <span className="ml-1 text-xs text-slate-500">（可选，最多3张，每张不超过20MB）</span>
          </label>

          {/* 图片预览 */}
          {selectedImages.length > 0 && (
            <div className="mb-3 space-y-2">
              {selectedImages.map((selectedImage, index) => (
                <div key={index} className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-3">
                  {/* 图片预览或状态图标 */}
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                    {selectedImage.uploading ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-500 border-t-transparent"></div>
                      </div>
                    ) : selectedImage.error ? (
                      <div className="flex h-full w-full items-center justify-center">
                        <X className="h-6 w-6 text-red-500" />
                      </div>
                    ) : (
                      <NextImage
                        src={selectedImage.previewUrl}
                        alt={`预览图片 ${index + 1}: ${selectedImage.file.name}`}
                          fill
                          className="object-cover"
                          sizes="48px"
                          unoptimized // 因为是本地 blob URL
                        />
                      )}
                    </div>
                    
                    {/* 文件信息 */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900">
                      {selectedImage.file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    {selectedImage.uploading && (
                      <p className="text-xs text-slate-500">上传中...</p>
                    )}
                    {selectedImage.error && (
                      <p className="text-xs text-red-600">{selectedImage.error}</p>
                    )}
                    {selectedImage.uploadedUrl && !selectedImage.uploading && (
                      <p className="text-xs text-emerald-600">上传成功</p>
                    )}
                    {!selectedImage.uploading && !selectedImage.error && !selectedImage.uploadedUrl && (
                      <p className="text-xs text-slate-500">待上传</p>
                    )}
                  </div>

                  {/* 删除按钮 */}
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-1 text-slate-400 transition-colors hover:text-red-500"
                    title="删除图片"
                    disabled={selectedImage.uploading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 上传按钮 */}
          {selectedImages.length < 3 && (
            <div className="relative">
              <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="sr-only"
                  id="image-upload"
              />
              <label
                htmlFor="image-upload"
                className="flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300/80 px-6 py-10 text-center text-sm text-slate-500 transition hover:border-slate-400"
              >
                <Image className="mb-2 h-6 w-6 text-slate-400" aria-label="上传图片图标" />
                <span>点击上传图片</span>
                <p className="mt-1 text-xs text-slate-400">支持 JPG、PNG、WebP、GIF 格式</p>
              </label>
            </div>
          )}
        </div>

        {/* 状态消息 */}
        {submitStatus === 'success' && (
          <div className="rounded-2xl border border-emerald-200/70 bg-emerald-50/80 p-4 text-sm text-emerald-700">
            反馈提交成功！感谢您的建议，我们会认真处理。
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="rounded-2xl border border-red-200/70 bg-red-50/80 p-4 text-sm text-red-700">
            {submitError}
          </div>
        )}

        {/* Cap 人机验证 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            人机验证 <span className="text-red-500">*</span>
          </label>
          <CapWidget
            onVerify={(token) => setCapToken(token)}
            onError={() => setCapToken('')}
            className="flex justify-center"
          />
          {!capToken && (
            <p className="mt-2 text-center text-xs text-slate-500">
              请完成人机验证后再提交反馈
            </p>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex justify-center sm:justify-end">
          <button
            type="submit"
            disabled={isSubmitting || !capToken}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {isSubmitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                提交中...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                提交反馈
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
