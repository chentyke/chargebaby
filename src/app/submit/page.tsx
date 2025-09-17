'use client';

import { useState } from 'react';
import Link from 'next/link';
import { BackButton } from '@/components/ui/back-button';
import { ChargeBabySubmissionForm } from '@/components/chargebaby-submission-form';
import { TestTube, Eye, FileText, Users, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function SubmitPage() {
  const [currentView, setCurrentView] = useState<'home' | 'form'>('home');
  const [hasAgreed, setHasAgreed] = useState(false);

  const handleStartSubmission = () => {
    if (hasAgreed) {
      setCurrentView('form');
    }
  };

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
        
        <div className="container py-6 sm:py-10 relative">
          {/* 返回按钮 */}
          <div className="mb-6">
            <BackButton 
              onClick={() => setCurrentView('home')} 
              variant="compact"
            >
              返回选择页面
            </BackButton>
          </div>

          <ChargeBabySubmissionForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100/50 relative">
      {/* 背景装饰 */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/20 via-transparent to-purple-50/20 pointer-events-none"></div>
      
      <div className="container py-6 sm:py-10 relative">
        {/* 返回按钮 */}
        <div className="mb-6">
          <BackButton href="/" variant="compact">
            返回首页
          </BackButton>
        </div>

        {/* 欢迎页面内容 */}
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <div className="text-center mb-8">
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                充电宝产品数据提交
              </span>
            </h1>
            <p className="text-lg text-gray-600/90 max-w-2xl mx-auto">
              非常感谢您的耐心参与！
            </p>
          </div>

          {/* 说明文本 */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 mb-8">
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 leading-relaxed mb-4">
                我们将收集有关产品的各项基本信息和测试数据，测试数据的版权归您所有，填写本收集表即视为您同意将此数据的使用权授予本数据库。
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-800 font-medium mb-1">测试流程参考</p>
                    <p className="text-blue-700 text-sm">
                      在开始之前，请阅读我们提供的测试流程参考指南。预计标准测试流程需要6小时～2天。在已有完整数据的情况下，预计填写此收集表需要10～15分钟。
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-amber-800 font-medium mb-1">重要提醒</p>
                    <p className="text-amber-700 text-sm">
                      网站暂不提供草稿功能，请确保您的数据已经存档备份。
                    </p>
                  </div>
                </div>
              </div>

              {/* 协议同意 */}
              <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasAgreed}
                    onChange={(e) => setHasAgreed(e.target.checked)}
                    className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700 text-sm">
                    我同意《数据收集与使用协议》，并确认我拥有提交数据的合法权利，同意将测试数据的使用权授予本数据库用于产品比较和分析目的。
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* 开始按钮 */}
          <div className="text-center mb-8">
            <button
              onClick={handleStartSubmission}
              disabled={!hasAgreed}
              className={`px-8 py-3 rounded-xl font-medium text-lg transition-all duration-300 ${
                hasAgreed
                  ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:scale-[0.98]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              开始提交数据
            </button>
          </div>

          {/* 其他选项 */}
          <div className="space-y-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">其他方式</h3>
            </div>
            
            {/* 外部表单选项 */}
            <Link href="https://docs.qq.com/form/page/DT1ZzRXZyZEZRTFJU" target="_blank" rel="noopener noreferrer">
              <div className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">使用外部表单提交</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      使用腾讯文档表单进行数据提交（原有方式）
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* 申请测试选项 */}
            <Link href="/wishlist">
              <div className="group bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 hover:shadow-xl hover:shadow-black/10 transition-all duration-300 cursor-pointer active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">我想看此产品的数据</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      申请测试感兴趣的充电宝产品
                    </p>
                    <div className="inline-flex items-center gap-1 text-purple-600 text-xs font-medium mt-2 group-hover:text-purple-700">
                      <Users className="w-3 h-3" />
                      查看待测排行榜
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}