'use client';

import { useState } from 'react';
import { Send, Plus, Minus } from 'lucide-react';
import { PRODUCT_FEATURES } from '@/types/chargebaby';

// 投稿数据接口
interface SubmissionData {
  // 基本信息
  brand: string;
  model: string;
  title: string;
  subtitle: string;
  tags: string[];
  price: number;
  releaseDate: string;
  imageUrl: string;
  
  // 评分数据
  overallRating: number;
  performanceRating: number;
  experienceRating: number;
  selfChargingCapability: number;
  outputCapability: number;
  energy: number;
  portability: number;
  chargingProtocols: number;
  multiPortUsage: number;
  
  // 详细技术数据
  detailData: {
    // 物理规格
    length: number;
    width: number;
    thickness: number;
    weight: number;
    volume: number;
    energyWeightRatio: number;
    energyVolumeRatio: number;
    
    // 电池容量
    capacityLevel: number;
    maxDischargeCapacity: number;
    selfChargingEnergy: number;
    dischargeCapacityAchievementRate: number;
    maxEnergyConversionRate: number;
    
    // 充电性能
    maxSelfChargingPower: number;
    selfChargingTime: number;
    avgSelfChargingPower: number;
    energy20min: number;
    
    // 输出性能
    maxOutputPower: number;
    maxContinuousOutputPower: number;
    
    // 数据来源
    dataSource: string;
  };
  
  // 优劣势
  advantages: string[];
  disadvantages: string[];
  
  // 投稿人信息
  submitterName: string;
  submitterEmail: string;
  submitterNote: string;
}

export function SubmissionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  
  const [formData, setFormData] = useState<SubmissionData>({
    // 基本信息
    brand: '',
    model: '',
    title: '',
    subtitle: '',
    tags: [],
    price: 0,
    releaseDate: '',
    imageUrl: '',
    
    // 评分数据
    overallRating: 0,
    performanceRating: 0,
    experienceRating: 0,
    selfChargingCapability: 0,
    outputCapability: 0,
    energy: 0,
    portability: 0,
    chargingProtocols: 0,
    multiPortUsage: 0,
    
    // 详细技术数据
    detailData: {
      length: 0,
      width: 0,
      thickness: 0,
      weight: 0,
      volume: 0,
      energyWeightRatio: 0,
      energyVolumeRatio: 0,
      capacityLevel: 0,
      maxDischargeCapacity: 0,
      selfChargingEnergy: 0,
      dischargeCapacityAchievementRate: 0,
      maxEnergyConversionRate: 0,
      maxSelfChargingPower: 0,
      selfChargingTime: 0,
      avgSelfChargingPower: 0,
      energy20min: 0,
      maxOutputPower: 0,
      maxContinuousOutputPower: 0,
      dataSource: '',
    },
    
    advantages: [],
    disadvantages: [],
    
    submitterName: '',
    submitterEmail: '',
    submitterNote: '',
  });

  const [newTag, setNewTag] = useState('');
  const [newAdvantage, setNewAdvantage] = useState('');
  const [newDisadvantage, setNewDisadvantage] = useState('');

  // 验证函数
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1: // 基本信息
        if (!formData.brand.trim()) newErrors.brand = '品牌不能为空';
        if (!formData.model.trim()) newErrors.model = '型号不能为空';
        if (!formData.title.trim()) newErrors.title = '标题不能为空';
        if (formData.price < 0) newErrors.price = '价格不能为负数';
        if (formData.imageUrl && !isValidUrl(formData.imageUrl)) {
          newErrors.imageUrl = '请输入有效的图片链接';
        }
        break;
        
      case 2: // 评分数据
        if (formData.overallRating < 0 || formData.overallRating > 100) {
          newErrors.overallRating = '综合评分应在 0-100 之间';
        }
        if (formData.performanceRating < 0 || formData.performanceRating > 100) {
          newErrors.performanceRating = '性能评分应在 0-100 之间';
        }
        if (formData.experienceRating < 0 || formData.experienceRating > 100) {
          newErrors.experienceRating = '体验评分应在 0-100 之间';
        }
        if (formData.selfChargingCapability < 0 || formData.selfChargingCapability > 40) {
          newErrors.selfChargingCapability = '自充能力应在 0-40 之间';
        }
        if (formData.outputCapability < 0 || formData.outputCapability > 35) {
          newErrors.outputCapability = '输出能力应在 0-35 之间';
        }
        if (formData.energy < 0 || formData.energy > 20) {
          newErrors.energy = '能量评分应在 0-20 之间';
        }
        if (formData.portability < 0 || formData.portability > 40) {
          newErrors.portability = '便携性应在 0-40 之间';
        }
        if (formData.chargingProtocols < 0 || formData.chargingProtocols > 30) {
          newErrors.chargingProtocols = '充电协议应在 0-30 之间';
        }
        if (formData.multiPortUsage < 0 || formData.multiPortUsage > 20) {
          newErrors.multiPortUsage = '多接口使用应在 0-20 之间';
        }
        break;
        
      case 3: // 技术参数
        if (formData.detailData.length < 0) {
          newErrors['detailData.length'] = '长度不能为负数';
        }
        if (formData.detailData.width < 0) {
          newErrors['detailData.width'] = '宽度不能为负数';
        }
        if (formData.detailData.thickness < 0) {
          newErrors['detailData.thickness'] = '厚度不能为负数';
        }
        if (formData.detailData.weight < 0) {
          newErrors['detailData.weight'] = '重量不能为负数';
        }
        if (formData.detailData.capacityLevel < 0) {
          newErrors['detailData.capacityLevel'] = '容量不能为负数';
        }
        if (formData.detailData.maxSelfChargingPower < 0) {
          newErrors['detailData.maxSelfChargingPower'] = '充电功率不能为负数';
        }
        if (formData.detailData.maxOutputPower < 0) {
          newErrors['detailData.maxOutputPower'] = '输出功率不能为负数';
        }
        break;
        
      case 5: // 投稿信息
        if (!formData.submitterName.trim()) {
          newErrors.submitterName = '姓名不能为空';
        }
        if (!formData.submitterEmail.trim()) {
          newErrors.submitterEmail = '邮箱不能为空';
        } else if (!isValidEmail(formData.submitterEmail)) {
          newErrors.submitterEmail = '请输入有效的邮箱地址';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return url.startsWith('http://') || url.startsWith('https://');
    } catch {
      return false;
    }
  };

  const steps = [
    { id: 1, title: '基本信息', description: '产品基本信息和图片' },
    { id: 2, title: '评分数据', description: '性能和体验评分' },
    { id: 3, title: '技术参数', description: '详细技术规格' },
    { id: 4, title: '优劣势', description: '产品优势和不足' },
    { id: 5, title: '投稿信息', description: '投稿人信息' },
  ];

  const updateFormData = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      } else if (keys.length === 2) {
        return {
          ...prev,
          [keys[0]]: {
            ...(prev as any)[keys[0]],
            [keys[1]]: value
          }
        };
      }
      return prev;
    });
  };

  const addToArray = (arrayName: 'tags' | 'advantages' | 'disadvantages', value: string) => {
    if (value.trim()) {
      setFormData(prev => ({
        ...prev,
        [arrayName]: [...prev[arrayName], value.trim()]
      }));
      
      // 清空输入框
      if (arrayName === 'tags') setNewTag('');
      if (arrayName === 'advantages') setNewAdvantage('');
      if (arrayName === 'disadvantages') setNewDisadvantage('');
    }
  };

  const removeFromArray = (arrayName: 'tags' | 'advantages' | 'disadvantages', index: number) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    // 最终验证
    if (!validateStep(5)) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setErrors({}); // 清空所有错误
      } else {
        setSubmitStatus('error');
        // 特殊处理数据库未配置的情况
        if (result.code === 'SUBMISSION_DB_NOT_CONFIGURED') {
          setSubmitError(result.error);
        } else {
          setSubmitError(result.error || '提交失败，请稍后重试');
        }
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    // 只对需要验证的步骤进行验证
    const needsValidation = [1, 2, 3, 5];
    if (needsValidation.includes(currentStep) && !validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setSubmitError(''); // 清空提交错误
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({}); // 切换步骤时清空错误
      setSubmitError('');
    }
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

  const getInputClassName = (fieldName: string) => {
    return `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[fieldName] 
        ? 'border-red-300 focus:ring-red-500' 
        : 'border-gray-200'
    }`;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">基本信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">品牌 *</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateFormData('brand', e.target.value)}
                  className={getInputClassName('brand')}
                  placeholder="如：安克"
                  required
                />
                {renderError('brand')}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">型号 *</label>
                <input
                  type="text"
                  value={formData.model}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  className={getInputClassName('model')}
                  placeholder="如：A1657"
                  required
                />
                {renderError('model')}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                className={getInputClassName('title')}
                placeholder="产品完整名称"
                required
              />
              {renderError('title')}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">副标题</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={(e) => updateFormData('subtitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="产品副标题或特色描述"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">官方定价 (元)</label>
                <input
                  type="number"
                  value={formData.price || ''}
                  onChange={(e) => updateFormData('price', parseFloat(e.target.value) || 0)}
                  className={getInputClassName('price')}
                  placeholder="0"
                  min="0"
                />
                {renderError('price')}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">发布时间</label>
                <input
                  type="month"
                  value={formData.releaseDate}
                  onChange={(e) => updateFormData('releaseDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">产品图片链接</label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => updateFormData('imageUrl', e.target.value)}
                className={getInputClassName('imageUrl')}
                placeholder="https://example.com/image.jpg"
              />
              {renderError('imageUrl')}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="添加标签"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('tags', newTag);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToArray('tags', newTag)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', index)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">评分数据</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">综合评分 (0-100)</label>
                <input
                  type="number"
                  value={formData.overallRating || ''}
                  onChange={(e) => updateFormData('overallRating', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性能评分 (0-100)</label>
                <input
                  type="number"
                  value={formData.performanceRating || ''}
                  onChange={(e) => updateFormData('performanceRating', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">体验评分 (0-100)</label>
                <input
                  type="number"
                  value={formData.experienceRating || ''}
                  onChange={(e) => updateFormData('experienceRating', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">自充能力 (0-40)</label>
                <input
                  type="number"
                  value={formData.selfChargingCapability || ''}
                  onChange={(e) => updateFormData('selfChargingCapability', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="40"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">输出能力 (0-35)</label>
                <input
                  type="number"
                  value={formData.outputCapability || ''}
                  onChange={(e) => updateFormData('outputCapability', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="35"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">能量 (0-20)</label>
                <input
                  type="number"
                  value={formData.energy || ''}
                  onChange={(e) => updateFormData('energy', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="20"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">便携性 (0-40)</label>
                <input
                  type="number"
                  value={formData.portability || ''}
                  onChange={(e) => updateFormData('portability', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="40"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">充电协议 (0-30)</label>
                <input
                  type="number"
                  value={formData.chargingProtocols || ''}
                  onChange={(e) => updateFormData('chargingProtocols', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="30"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">多接口使用 (0-20)</label>
                <input
                  type="number"
                  value={formData.multiPortUsage || ''}
                  onChange={(e) => updateFormData('multiPortUsage', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0" max="20"
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">技术参数</h3>
            
            {/* 物理规格 */}
            <div>
              <h4 className="text-base font-medium text-gray-800 mb-3">物理规格</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">长度 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.length || ''}
                    onChange={(e) => updateFormData('detailData.length', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">宽度 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.width || ''}
                    onChange={(e) => updateFormData('detailData.width', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">厚度 (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.thickness || ''}
                    onChange={(e) => updateFormData('detailData.thickness', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">重量 (g)</label>
                  <input
                    type="number"
                    value={formData.detailData.weight || ''}
                    onChange={(e) => updateFormData('detailData.weight', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">体积 (cm³)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.volume || ''}
                    onChange={(e) => updateFormData('detailData.volume', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* 电池容量 */}
            <div>
              <h4 className="text-base font-medium text-gray-800 mb-3">电池容量</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">容量级别 (mAh)</label>
                  <input
                    type="number"
                    value={formData.detailData.capacityLevel || ''}
                    onChange={(e) => updateFormData('detailData.capacityLevel', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大放电容量 (Wh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.maxDischargeCapacity || ''}
                    onChange={(e) => updateFormData('detailData.maxDischargeCapacity', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">自充能量 (Wh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.selfChargingEnergy || ''}
                    onChange={(e) => updateFormData('detailData.selfChargingEnergy', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            {/* 充电和输出性能 */}
            <div>
              <h4 className="text-base font-medium text-gray-800 mb-3">充电和输出性能</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大自充电功率 (W)</label>
                  <input
                    type="number"
                    value={formData.detailData.maxSelfChargingPower || ''}
                    onChange={(e) => updateFormData('detailData.maxSelfChargingPower', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最大输出功率 (W)</label>
                  <input
                    type="number"
                    value={formData.detailData.maxOutputPower || ''}
                    onChange={(e) => updateFormData('detailData.maxOutputPower', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">自充电时间 (分钟)</label>
                  <input
                    type="number"
                    value={formData.detailData.selfChargingTime || ''}
                    onChange={(e) => updateFormData('detailData.selfChargingTime', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">20分钟充入能量 (Wh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.detailData.energy20min || ''}
                    onChange={(e) => updateFormData('detailData.energy20min', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">数据来源 / 测试人</label>
              <input
                type="text"
                value={formData.detailData.dataSource}
                onChange={(e) => updateFormData('detailData.dataSource', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="测试人姓名或机构"
              />
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">优势与不足</h3>
            
            {/* 优势 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品优势</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newAdvantage}
                  onChange={(e) => setNewAdvantage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="添加优势点"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('advantages', newAdvantage);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToArray('advantages', newAdvantage)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.advantages.map((advantage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg"
                  >
                    <span className="text-green-600 font-medium">+</span>
                    <span className="flex-1 text-gray-700">{advantage}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('advantages', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 不足 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">产品不足</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newDisadvantage}
                  onChange={(e) => setNewDisadvantage(e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="添加不足点"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('disadvantages', newDisadvantage);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => addToArray('disadvantages', newDisadvantage)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2">
                {formData.disadvantages.map((disadvantage, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
                  >
                    <span className="text-red-600 font-medium">-</span>
                    <span className="flex-1 text-gray-700">{disadvantage}</span>
                    <button
                      type="button"
                      onClick={() => removeFromArray('disadvantages', index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">投稿人信息</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名 *</label>
                <input
                  type="text"
                  value={formData.submitterName}
                  onChange={(e) => updateFormData('submitterName', e.target.value)}
                  className={getInputClassName('submitterName')}
                  placeholder="您的姓名"
                  required
                />
                {renderError('submitterName')}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱 *</label>
                <input
                  type="email"
                  value={formData.submitterEmail}
                  onChange={(e) => updateFormData('submitterEmail', e.target.value)}
                  className={getInputClassName('submitterEmail')}
                  placeholder="your@email.com"
                  required
                />
                {renderError('submitterEmail')}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">备注信息</label>
              <textarea
                value={formData.submitterNote}
                onChange={(e) => updateFormData('submitterNote', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
                placeholder="测试环境、设备信息或其他补充说明..."
              />
            </div>
            
            {submitStatus === 'success' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800">投稿成功！感谢您的贡献，我们会尽快审核您的提交。</p>
              </div>
            )}
            
            {submitStatus === 'error' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800">{submitError || '提交失败，请检查网络连接或稍后重试。'}</p>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="p-6 sm:p-8">
      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                currentStep === step.id
                  ? 'bg-blue-600 text-white'
                  : currentStep > step.id
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <div className="ml-3 hidden sm:block">
                <div className={`text-sm font-medium ${
                  currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-500">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-px mx-4 ${
                  currentStep > step.id ? 'bg-green-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={prevStep}
          disabled={currentStep === 1}
          className="px-6 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          上一步
        </button>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={nextStep}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            下一步
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.submitterName || !formData.submitterEmail}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                提交中...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                提交投稿
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}