'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle } from 'lucide-react';

interface ImageUploadProps {
  onFileSelect: (file: File | null) => void; // 文件选择回调
  onUploadError?: (error: string) => void;
  currentImageUrl?: string;
  maxSize?: number; // 最大文件大小（字节）
  acceptedTypes?: string[];
  disabled?: boolean;
  className?: string;
}

interface LocalFile {
  file: File;
  previewUrl: string;
}

export function ImageUpload({
  onFileSelect,
  onUploadError,
  currentImageUrl,
  maxSize = 20 * 1024 * 1024, // 20MB
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<LocalFile | null>(null);
  const [error, setError] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    if (!acceptedTypes.includes(file.type)) {
      return `不支持的文件格式。请选择 ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} 格式的图片`;
    }
    
    if (file.size > maxSize) {
      return `文件过大。请选择小于 ${formatFileSize(maxSize)} 的图片`;
    }
    
    return null;
  }, [acceptedTypes, maxSize]);

  // 处理文件选择（本地保存）
  const selectFile = useCallback((file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      onUploadError?.(validationError);
      return;
    }

    // 创建预览URL
    const previewUrl = URL.createObjectURL(file);
    const localFile: LocalFile = {
      file,
      previewUrl
    };

    // 清理之前的预览URL
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }

    setSelectedFile(localFile);
    setError('');
    onFileSelect(file);
  }, [validateFile, onFileSelect, onUploadError, selectedFile]);

  // 处理文件选择（已包含在selectFile中）
  // const handleFileSelect = selectFile;

  // 文件输入变化
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      selectFile(file);
    }
  };

  // 拖拽事件处理
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(event.dataTransfer.files);
    const file = files[0];
    
    if (file) {
      selectFile(file);
    }
  };

  // 删除选择的文件
  const handleRemoveFile = () => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onFileSelect(null); // 清空回调
  };

  // 点击上传区域
  const handleUploadAreaClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const hasSelectedFile = selectedFile || currentImageUrl;

  // 清理预览URL
  const cleanup = useCallback(() => {
    if (selectedFile?.previewUrl) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
  }, [selectedFile]);

  // 组件卸载时清理
  React.useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 上传区域 */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : hasSelectedFile
            ? 'border-green-300 bg-green-50'
            : error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${disabled ? 'cursor-not-allowed opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleUploadAreaClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        {hasSelectedFile ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                {selectedFile?.file.name || '图片已选择'}
              </p>
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.file.size)}
                </p>
              )}
              <p className="text-xs text-green-600">图片已选择，提交时将上传</p>
            </div>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-red-900">选择失败</p>
              <p className="text-xs text-red-600">{error}</p>
              <p className="text-xs text-gray-500">点击重新选择图片</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="w-12 h-12 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-900">
                点击选择图片或拖拽图片到此处
              </p>
              <p className="text-xs text-gray-500">
                支持 JPG、PNG、WebP、GIF 格式，最大 {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 已选择文件预览 */}
      {selectedFile && (
        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center space-x-3">
            {/* 图片预览 */}
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
              <Image
                src={selectedFile.previewUrl}
                alt="预览"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{selectedFile.file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(selectedFile.file.size)}</p>
            </div>
          </div>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveFile();
            }}
            disabled={disabled}
            className="p-1 text-gray-400 hover:text-red-500 transition-colors disabled:cursor-not-allowed"
            title="删除图片"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 错误信息 */}
      {error && !selectedFile && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}