'use client';

import { useState } from 'react';
import { Send, Image, X } from 'lucide-react';
import NextImage from 'next/image';
import { TurnstileWidget } from './turnstile-widget';

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
  const [turnstileToken, setTurnstileToken] = useState<string>('');

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

  const uploadImageToServer = async (file: File, turnstileToken: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('turnstileToken', turnstileToken);
    
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

    // 检查Turnstile验证
    if (!turnstileToken) {
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
            const url = await uploadImageToServer(selectedImage.file, turnstileToken);
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
        setTurnstileToken(''); // 重置验证token
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
    return `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
      errors[fieldName] 
        ? 'border-red-300 focus:ring-red-500' 
        : 'border-gray-200 focus:border-blue-300'
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
    <div className="min-h-screen bg-gray-50 py-4 px-4 sm:py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-4 sm:px-6 border-b border-gray-200">
          <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">用户反馈</h2>
          <p className="text-sm text-gray-600 mt-1">
            帮助我们改进产品，您的反馈对我们非常重要
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
          {/* 反馈标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              反馈类型 <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {feedbackTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                    formData.type === type.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
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
                  <span className="text-sm font-medium text-gray-900">
                    {type.label}
                  </span>
                </label>
              ))}
            </div>
            {renderError('type')}
          </div>

          {/* 详细描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              详细描述 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className={getInputClassName('description')}
              rows={4}
              placeholder="请详细描述您遇到的问题、建议或想法..."
              required
            />
            {renderError('description')}
          </div>

          {/* 联系方式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              联系方式
              <span className="text-gray-500 text-xs ml-1">（可选，方便我们与您联系）</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              相关图片
              <span className="text-gray-500 text-xs ml-1">（可选，最多3张，每张不超过20MB）</span>
            </label>
            
            {/* 图片预览 */}
            {selectedImages.length > 0 && (
              <div className="space-y-2 mb-3">
                {selectedImages.map((selectedImage, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    {/* 图片预览或状态图标 */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                      {selectedImage.uploading ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : selectedImage.error ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <X className="w-6 h-6 text-red-500" />
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
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedImage.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(selectedImage.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                      {selectedImage.uploading && (
                        <p className="text-xs text-blue-600">上传中...</p>
                      )}
                      {selectedImage.error && (
                        <p className="text-xs text-red-600">{selectedImage.error}</p>
                      )}
                      {selectedImage.uploadedUrl && !selectedImage.uploading && (
                        <p className="text-xs text-green-600">上传成功</p>
                      )}
                      {!selectedImage.uploading && !selectedImage.error && !selectedImage.uploadedUrl && (
                        <p className="text-xs text-gray-600">待上传</p>
                      )}
                    </div>
                    
                    {/* 删除按钮 */}
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      title="删除图片"
                      disabled={selectedImage.uploading}
                    >
                      <X className="w-4 h-4" />
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
                  className="flex items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 cursor-pointer transition-colors"
                >
                  <div className="text-center">
                    <Image className="w-6 h-6 text-gray-400 mx-auto mb-1" aria-label="上传图片图标" />
                    <span className="text-sm text-gray-500">点击上传图片</span>
                    <p className="text-xs text-gray-400 mt-1">
                      支持 JPG、PNG、WebP、GIF 格式
                    </p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* 状态消息 */}
          {submitStatus === 'success' && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">反馈提交成功！感谢您的建议，我们会认真处理。</p>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{submitError}</p>
            </div>
          )}

          {/* 人机验证 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              人机验证 <span className="text-red-500">*</span>
            </label>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <TurnstileWidget
                onVerify={(token) => setTurnstileToken(token)}
                onError={() => setTurnstileToken('')}
                className="flex justify-center"
              />
              {!turnstileToken && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  请完成人机验证后再提交反馈
                </p>
              )}
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-center sm:justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !turnstileToken}
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交反馈
                </>
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
}