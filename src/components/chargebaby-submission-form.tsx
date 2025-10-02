'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Send, Plus, Minus, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// 基于设计草稿的完整数据结构
interface ChargeBabySubmissionData {
  // 基础信息
  productName: string;
  brand: string;
  model: string;
  capacityLevel: number;
  
  // 物理规格
  length: number;
  width: number;
  thickness: number;
  weight: number;
  cableLengths: string[];
  cableFlexibility: string;
  cableFlexibilityOther: string;
  
  // 性能数据：自充电
  selfChargingTime: number;
  selfChargingEnergy: number;
  energy20min: number;
  
  // 性能数据：输出
  maxContinuousOutputPower: number;
  maxDischargeCapacity: number;
  
  // 温度与纹波
  maxSurfaceTemperature: string;
  temperatureUniformity: string;
  thermalControlStrategy: string[];
  maxRipple: string;
  temperatureEstimated: boolean;
  temperatureUniformityEstimated: boolean;
  maxRippleEstimated: boolean;
  
  // 协议支持性
  pdFixedVoltageSupport: string[];
  pdPpsSupport: string[];
  pdAvsSupport: string[];
  qcSupport: string[];
  ufcsSupport: string[];
  privateProtocolSupport: string[];
  potentialProtocolConflicts: string;
  
  // 多接口使用
  dualPortOutputCapability: string;
  dualPortPassthrough: string;
  dualPortNoDisconnect: string[];
  
  // 信息显示与其他功能
  displayContent: string[];
  displayCarrier: string;
  displayBrightness: string;
  displayCustomization: string[];
  portDirectionCustomization: string;
  iotCapabilities: string[];
  
  // 产品评价与个人信息
  advantages: string;
  disadvantages: string;
  submitterName: string;
  submitterContact: string;
  additionalNotes: string;
}

const CABLE_LENGTH_OPTIONS = [
  '没有附带不可拆卸的线缆',
  '<10cm',
  '10-25cm',
  '25-50cm',
  '>50cm'
];

const CABLE_FLEXIBILITY_OPTIONS = [
  '没有附带不可拆卸的线缆',
  '较硬',
  '中等',
  '柔软',
  '其他'
];

const TEMPERATURE_OPTIONS = [
  '<44℃',
  '44℃～48℃',
  '48℃～54℃',
  '>54℃',
  '本项结果由估测得到'
];

const TEMPERATURE_UNIFORMITY_OPTIONS = [
  '极不均匀（出现个别点位温度很高，其余部分温度较低的现象）',
  '较均匀（没有出现点状高温，但电路部分与电芯部分仍存在一定的温度分布不均匀）',
  '很均匀（电路部分与电芯部分温度接近）',
  '本项结果由估测得到'
];

const THERMAL_CONTROL_OPTIONS = [
  '仅根据温度限制自充/输出功率，不存在"定时器"机制',
  '存在"定时器"机制，且最短定时器小于5分钟',
  '存在"定时器"机制，且最短定时器大于5分钟，小于10分钟',
  '存在"定时器"机制，且最短定时器大于10分钟，小于30分钟',
  '存在"定时器"机制，且最短定时器大于30分钟',
  '定时器可以通过按键重置（无需插拔接口）'
];

const RIPPLE_OPTIONS = [
  '<50mV',
  '50-100mV',
  '100-200mV',
  '>200mV',
  '本项结果由估测得到'
];

const ESTIMATION_LABEL = '本项结果由估测得到';
const TEMPERATURE_BASE_OPTIONS = TEMPERATURE_OPTIONS.filter(option => option !== ESTIMATION_LABEL);
const TEMPERATURE_UNIFORMITY_BASE_OPTIONS = TEMPERATURE_UNIFORMITY_OPTIONS.filter(option => option !== ESTIMATION_LABEL);
const RIPPLE_BASE_OPTIONS = RIPPLE_OPTIONS.filter(option => option !== ESTIMATION_LABEL);

const DISPLAY_CUSTOMIZATION_OPTIONS = [
  '不具有任何显示载体，或不具备任何下列自定义调节能力',
  '可以手动/自动关闭显示载体（只要可以在使用过程中处于屏幕关闭状态，即勾选）',
  '显示载体为TFT显示屏，且支持常亮显示（只要可以在使用过程中长期处于屏幕开启状态，即勾选）',
  '显示载体为TFT显示屏，且支持自定义是否开启常亮显示，或设置亮屏时长'
];

const PORT_DIRECTION_OPTIONS = [
  '不具有自定义特定接口输入输出方向的能力',
  '可以自定义特定接口输入输出方向（例如下图所示）'
];

export function ChargeBabySubmissionForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  
  const [formData, setFormData] = useState<ChargeBabySubmissionData>({
    // 基础信息
    productName: '',
    brand: '',
    model: '',
    capacityLevel: 0,
    
    // 物理规格
    length: 0,
    width: 0,
    thickness: 0,
    weight: 0,
    cableLengths: [],
    cableFlexibility: '',
    cableFlexibilityOther: '',
    
    // 性能数据：自充电
    selfChargingTime: 0,
    selfChargingEnergy: 0,
    energy20min: 0,
    
    // 性能数据：输出
    maxContinuousOutputPower: 0,
    maxDischargeCapacity: 0,
    
    // 温度与纹波
    maxSurfaceTemperature: '',
    temperatureUniformity: '',
    thermalControlStrategy: [],
    maxRipple: '',
    temperatureEstimated: false,
    temperatureUniformityEstimated: false,
    maxRippleEstimated: false,
    
    // 协议支持性
    pdFixedVoltageSupport: [],
    pdPpsSupport: [],
    pdAvsSupport: [],
    qcSupport: [],
    ufcsSupport: [],
    privateProtocolSupport: [],
    potentialProtocolConflicts: '',
    
    // 多接口使用
    dualPortOutputCapability: '',
    dualPortPassthrough: '',
    dualPortNoDisconnect: [],
    
    // 信息显示与其他功能
    displayContent: [],
    displayCarrier: '',
    displayBrightness: '',
    displayCustomization: [],
    portDirectionCustomization: '',
    iotCapabilities: [],
    
    // 产品评价与个人信息
    advantages: '',
    disadvantages: '',
    submitterName: '',
    submitterContact: '',
    additionalNotes: '',
  });

  const [cableLengthInput, setCableLengthInput] = useState('');
  const [pdPpsInput, setPdPpsInput] = useState('');
  const [ufcsInput, setUfcsInput] = useState('');
  const [privateProtocolInput, setPrivateProtocolInput] = useState('');

  const steps = [
    { id: 1, title: '欢迎页', description: '产品基础信息' },
    { id: 2, title: '物理规格', description: '尺寸重量规格' },
    { id: 3, title: '自充电性能', description: '充电时间和能量' },
    { id: 4, title: '输出性能', description: '输出功率和容量' },
    { id: 5, title: '温度与纹波', description: '温控和纹波测试' },
    { id: 6, title: '协议支持', description: '充电协议兼容性' },
    { id: 7, title: '多接口功能', description: '多端口使用能力' },
    { id: 8, title: '显示功能', description: '信息显示和IoT功能' },
    { id: 9, title: '产品评价', description: '优缺点和个人信息' },
    { id: 10, title: '完成', description: '提交确认' },
  ];

  const updateFormData = (field: keyof ChargeBabySubmissionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleArrayValue = (field: keyof ChargeBabySubmissionData, value: string) => {
    setFormData(prev => {
      const currentArray = prev[field] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const toggleOptionWithExclusive = (
    field: keyof ChargeBabySubmissionData,
    value: string,
    exclusiveValue: string
  ) => {
    setFormData(prev => {
      const current = (prev[field] as string[]) || [];
      const hasValue = current.includes(value);

      if (value === exclusiveValue) {
        if (hasValue) {
          return {
            ...prev,
            [field]: current.filter(item => item !== value),
          };
        }
        return {
          ...prev,
          [field]: [exclusiveValue],
        };
      }

      const withoutExclusive = current.filter(item => item !== exclusiveValue);
      const next = hasValue
        ? withoutExclusive.filter(item => item !== value)
        : [...withoutExclusive, value];

      return {
        ...prev,
        [field]: next,
      };
    });
  };

  const addCustomValue = (field: keyof ChargeBabySubmissionData, value: string, noneLabel?: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setFormData(prev => {
      const currentArray = (prev[field] as string[]) || [];
      const filtered = noneLabel ? currentArray.filter(item => item !== noneLabel) : currentArray;
      if (filtered.includes(trimmed)) {
        return prev;
      }
      return {
        ...prev,
        [field]: [...filtered, trimmed],
      };
    });
  };

  const handleAddCableLength = () => {
    if (!cableLengthInput.trim()) return;
    addCustomValue('cableLengths', cableLengthInput);
    setCableLengthInput('');
  };

  const handleAddPdPps = () => {
    if (!pdPpsInput.trim()) return;
    addCustomValue('pdPpsSupport', pdPpsInput, '不支持PPS');
    setPdPpsInput('');
  };

  const handleAddUfcs = () => {
    if (!ufcsInput.trim()) return;
    addCustomValue('ufcsSupport', ufcsInput, '不支持UFCS');
    setUfcsInput('');
  };

  const handleAddPrivateProtocol = () => {
    if (!privateProtocolInput.trim()) return;
    addCustomValue('privateProtocolSupport', privateProtocolInput, '不支持私有协议');
    setPrivateProtocolInput('');
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};
    
    switch (step) {
      case 1: // 基础信息
        if (!formData.productName.trim()) newErrors.productName = '产品名称不能为空';
        if (!formData.brand.trim()) newErrors.brand = '品牌不能为空';
        if (formData.capacityLevel <= 0) newErrors.capacityLevel = '容量级别必须大于0';
        break;
      case 9: // 个人信息
        if (!formData.submitterName.trim()) newErrors.submitterName = '姓名不能为空';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateStep(9)) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitError('');

    try {
      const formatOtherOption = (selected: string, custom: string) => {
        if (selected === '其他') {
          const trimmed = custom.trim();
          return trimmed || '未填写';
        }
        return selected?.trim() || '未填写';
      };

      const formatEstimated = (value: string, estimated: boolean) => {
        const trimmed = value.trim();
        if (!trimmed) {
          return estimated ? '未填写（估测）' : '未填写';
        }
        return estimated ? `${trimmed}（估测）` : trimmed;
      };

      const formatList = (values: string[]) => {
        const filtered = (values || [])
          .map(item => item.trim())
          .filter(item => item.length > 0);
        return filtered.length ? filtered.join(', ') : '未填写';
      };

      const cableLengthValue = formatList(formData.cableLengths);
      const cableFlexibilityValue = formatOtherOption(formData.cableFlexibility, formData.cableFlexibilityOther);
      const maxTemperatureValue = formatEstimated(formData.maxSurfaceTemperature, formData.temperatureEstimated);
      const temperatureUniformityValue = formatEstimated(formData.temperatureUniformity, formData.temperatureUniformityEstimated);
      const maxRippleValue = formatEstimated(formData.maxRipple, formData.maxRippleEstimated);
      const protocolConflictValue = formData.potentialProtocolConflicts.trim() || '不存在潜在冲突';

      // 转换数据格式以适配现有API
      const submissionData = {
        brand: formData.brand,
        model: formData.model,
        title: formData.productName,
        subtitle: `${formData.capacityLevel}mAh 充电宝`,
        tags: ['用户提交'],
        price: 0,
        releaseDate: '',
        imageUrl: '',
        
        overallRating: 0,
        performanceRating: 0,
        experienceRating: 0,
        selfChargingCapability: 0,
        outputCapability: 0,
        energy: 0,
        portability: 0,
        chargingProtocols: 0,
        multiPortUsage: 0,
        
        detailData: {
          length: formData.length,
          width: formData.width,
          thickness: formData.thickness,
          weight: formData.weight,
          volume: formData.length * formData.width * formData.thickness,
          energyWeightRatio: formData.weight > 0 ? formData.selfChargingEnergy / formData.weight : 0,
          energyVolumeRatio: 0,
          capacityLevel: formData.capacityLevel,
          maxDischargeCapacity: formData.maxDischargeCapacity,
          selfChargingEnergy: formData.selfChargingEnergy,
          dischargeCapacityAchievementRate: 0,
          maxEnergyConversionRate: 0,
          maxSelfChargingPower: 0,
          selfChargingTime: formData.selfChargingTime,
          avgSelfChargingPower: formData.selfChargingTime > 0 ? (formData.selfChargingEnergy * 60) / formData.selfChargingTime : 0,
          energy20min: formData.energy20min,
          maxOutputPower: 0,
          maxContinuousOutputPower: formData.maxContinuousOutputPower,
          dataSource: formData.submitterName,
        },
        
        advantages: [formData.advantages],
        disadvantages: [formData.disadvantages],
        
        submitterName: formData.submitterName,
        submitterEmail: '',
        submitterContact: formData.submitterContact,
        submitterNote: `
详细测试数据：
线缆长度: ${cableLengthValue}
线缆柔软度: ${cableFlexibilityValue}
最高温度: ${maxTemperatureValue}
温度均匀性: ${temperatureUniformityValue}
温控策略: ${formatList(formData.thermalControlStrategy)}
最大纹波: ${maxRippleValue}
PD固定档支持: ${formatList(formData.pdFixedVoltageSupport)}
PD PPS支持: ${formatList(formData.pdPpsSupport)}
QC支持: ${formatList(formData.qcSupport)}
UFCS支持: ${formatList(formData.ufcsSupport)}
私有协议支持: ${formatList(formData.privateProtocolSupport)}
潜在协议冲突: ${protocolConflictValue}
双接口边充边放: ${formData.dualPortPassthrough || '未填写'}
双接口输出能力: ${formData.dualPortOutputCapability || '未填写'}
双接口不断联能力: ${formatList(formData.dualPortNoDisconnect)}
显示内容: ${formatList(formData.displayContent)}
显示载体: ${formData.displayCarrier || '未填写'}
显示亮度: ${formData.displayBrightness || '未填写'}
显示自定义能力: ${formatList(formData.displayCustomization)}
接口方向自定义: ${formData.portDirectionCustomization || '未填写'}
IoT能力: ${formatList(formData.iotCapabilities)}
其他备注: ${formData.additionalNotes}
        `.trim(),
      };

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setCurrentStep(10); // 跳转到完成页
      } else {
        setSubmitStatus('error');
        setSubmitError(result.error || '提交失败，请稍后重试');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitError('网络错误，请检查网络连接后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => {
    const needsValidation = [1, 9];
    if (needsValidation.includes(currentStep) && !validateStep(currentStep)) {
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setSubmitError('');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setErrors({});
      setSubmitError('');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">产品基础信息</h3>
            
            <div className="space-y-2">
              <Label htmlFor="productName" className="text-sm font-medium text-gray-900">
                移动电源的名称 *
              </Label>
              <p className="text-xs text-muted-foreground">一般以产品外壳标识为准</p>
              <Input
                id="productName"
                type="text"
                value={formData.productName}
                onChange={(e) => updateFormData('productName', e.target.value)}
                className={cn(
                  errors.productName && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="例：小米自带线充电宝 10000 67W"
              />
              {errors.productName && (
                <p className="text-destructive text-xs">{errors.productName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand" className="text-sm font-medium text-gray-900">品牌 *</Label>
                <p className="text-xs text-muted-foreground">如无品牌，可填入制造商名称</p>
                <Input
                  id="brand"
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateFormData('brand', e.target.value)}
                  className={cn(
                    errors.brand && "border-destructive focus-visible:ring-destructive"
                  )}
                  placeholder="例：小米"
                />
                {errors.brand && (
                  <p className="text-destructive text-xs">{errors.brand}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model" className="text-sm font-medium text-gray-900">型号</Label>
                <p className="text-xs text-muted-foreground">以产品外壳标识为准</p>
                <Input
                  id="model"
                  type="text"
                  value={formData.model}
                  onChange={(e) => updateFormData('model', e.target.value)}
                  placeholder="例：PB1067"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacityLevel" className="text-sm font-medium text-gray-900">容量级别 (mAh) *</Label>
              <Input
                id="capacityLevel"
                type="number"
                value={formData.capacityLevel || ''}
                onChange={(e) => updateFormData('capacityLevel', parseFloat(e.target.value) || 0)}
                className={cn(
                  errors.capacityLevel && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="例：10000"
              />
              {errors.capacityLevel && (
                <p className="text-destructive text-xs">{errors.capacityLevel}</p>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">物理规格</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="length" className="text-sm font-medium text-gray-900">长度 (cm)</Label>
                <p className="text-xs text-muted-foreground">以实际测量为准，亦可填入官方数据</p>
                <Input
                  id="length"
                  type="number"
                  step="0.1"
                  value={formData.length || ''}
                  onChange={(e) => updateFormData('length', parseFloat(e.target.value) || 0)}
                  placeholder="11.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="width" className="text-sm font-medium text-gray-900">宽度 (cm)</Label>
                <p className="text-xs text-muted-foreground">以实际测量为准，亦可填入官方数据</p>
                <Input
                  id="width"
                  type="number"
                  step="0.1"
                  value={formData.width || ''}
                  onChange={(e) => updateFormData('width', parseFloat(e.target.value) || 0)}
                  placeholder="6.6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="thickness" className="text-sm font-medium text-gray-900">厚度 (cm)</Label>
                <p className="text-xs text-muted-foreground">以实际测量为准，亦可填入官方数据</p>
                <Input
                  id="thickness"
                  type="number"
                  step="0.1"
                  value={formData.thickness || ''}
                  onChange={(e) => updateFormData('thickness', parseFloat(e.target.value) || 0)}
                  placeholder="2.6"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-sm font-medium text-gray-900">重量 (g)</Label>
                <p className="text-xs text-muted-foreground">以实际测量为准，亦可填入官方数据</p>
                <Input
                  id="weight"
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => updateFormData('weight', parseFloat(e.target.value) || 0)}
                  placeholder="247"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">线缆长度 (cm)</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源附带的不可拆卸线缆长度。如有多根线缆，请新增多条记录。</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CABLE_LENGTH_OPTIONS.map((option, index) => (
                  <label
                    key={option}
                    htmlFor={`cable-length-${index}`}
                    className="flex items-center space-x-3 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-normal text-gray-700 shadow-sm hover:border-blue-300"
                  >
                    <Checkbox
                      id={`cable-length-${index}`}
                      checked={formData.cableLengths.includes(option)}
                      onCheckedChange={() => toggleArrayValue('cableLengths', option)}
                    />
                    <span className="cursor-pointer select-none">{option}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="text"
                  placeholder="其他长度，如 35cm"
                  className="sm:flex-1"
                  value={cableLengthInput}
                  onChange={(e) => setCableLengthInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCableLength();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCableLength}
                >
                  <Plus className="mr-1 h-4 w-4" /> 添加长度
                </Button>
              </div>
              {formData.cableLengths.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.cableLengths.map((item, index) => (
                    <span key={`${item}-${index}`} className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs text-primary">
                      {item}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArrayValue('cableLengths', item)}
                        className="h-auto p-0 text-primary/70 hover:text-primary"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">线缆柔软度</Label>
                <p className="text-xs text-muted-foreground mt-1">对移动电源附带的不可拆卸线缆柔软程度的主观感受。</p>
              </div>
              <RadioGroup
                value={formData.cableFlexibility}
                onValueChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    cableFlexibility: value,
                    cableFlexibilityOther: value === '其他' ? prev.cableFlexibilityOther : '',
                  }));
                }}
                className="grid gap-3"
              >
                {CABLE_FLEXIBILITY_OPTIONS.map(option => {
                  const isOther = option === '其他';
                  const isSelected = formData.cableFlexibility === option;
                  return (
                    <div key={option} className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value={option} id={`cable-flex-${option}`} />
                        <Label 
                          htmlFor={`cable-flex-${option}`} 
                          className="text-sm font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                      {isOther && isSelected && (
                        <Input
                          value={formData.cableFlexibilityOther}
                          onChange={(e) => updateFormData('cableFlexibilityOther', e.target.value)}
                          placeholder="请描述线缆柔软度"
                        />
                      )}
                    </div>
                  );
                })}
              </RadioGroup>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">性能数据：自充电</h3>
            
            <div className="space-y-2">
              <Label htmlFor="selfChargingTime" className="text-sm font-medium text-gray-900">自充电时长 (min)</Label>
              <p className="text-xs text-muted-foreground">在自然散热条件下，从"完全放电（0%）"状态充电至"完全充满"（100%，且输入功率小于1W）状态所需的时间。</p>
              <Input
                id="selfChargingTime"
                type="number"
                value={formData.selfChargingTime || ''}
                onChange={(e) => updateFormData('selfChargingTime', parseFloat(e.target.value) || 0)}
                placeholder="75"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="selfChargingEnergy" className="text-sm font-medium text-gray-900">自充能量 (Wh)</Label>
              <p className="text-xs text-muted-foreground">从"完全放电（0%）"状态充电至"完全充满"状态所充入的能量。请勿使用mAh数据。</p>
              <Input
                id="selfChargingEnergy"
                type="number"
                step="0.01"
                value={formData.selfChargingEnergy || ''}
                onChange={(e) => updateFormData('selfChargingEnergy', parseFloat(e.target.value) || 0)}
                placeholder="43.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="energy20min" className="text-sm font-medium text-gray-900">20分钟充入能量 (Wh)</Label>
              <p className="text-xs text-muted-foreground">从"完全放电（0%）"状态充电，前20分钟所充入的能量。</p>
              <Input
                id="energy20min"
                type="number"
                step="0.01"
                value={formData.energy20min || ''}
                onChange={(e) => updateFormData('energy20min', parseFloat(e.target.value) || 0)}
                placeholder="18.48"
              />
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">性能数据：输出</h3>
            
            <div className="space-y-2">
              <Label htmlFor="maxContinuousOutputPower" className="text-sm font-medium text-gray-900">最大持续输出平均功率 (W)</Label>
              <p className="text-xs text-muted-foreground">在自然散热条件下，从"完全充满"状态开始连续最大功率放电，直至达到"完全放电"状态的平均功率。</p>
              <Input
                id="maxContinuousOutputPower"
                type="number"
                value={formData.maxContinuousOutputPower || ''}
                onChange={(e) => updateFormData('maxContinuousOutputPower', parseFloat(e.target.value) || 0)}
                placeholder="39"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxDischargeCapacity" className="text-sm font-medium text-gray-900">最大放电容量 (Wh)</Label>
              <p className="text-xs text-muted-foreground">在任意条件下使用任意功率从"完全充满"状态开始放电直到"完全放电"状态时的最大放电容量。</p>
              <Input
                id="maxDischargeCapacity"
                type="number"
                step="0.01"
                value={formData.maxDischargeCapacity || ''}
                onChange={(e) => updateFormData('maxDischargeCapacity', parseFloat(e.target.value) || 0)}
                placeholder="37.62"
              />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">性能数据：温度与纹波</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">表面最高温度 (℃)</Label>
                <p className="text-xs text-muted-foreground mt-1">在自充电或高负载输出场景下，移动电源表面出现的最高温度。</p>
              </div>
              <RadioGroup
                value={formData.maxSurfaceTemperature}
                onValueChange={(value) => updateFormData('maxSurfaceTemperature', value)}
                className="grid gap-3"
              >
                {TEMPERATURE_BASE_OPTIONS.map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`temp-${option}`} />
                    <Label 
                      htmlFor={`temp-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="max-temp-estimated"
                  checked={formData.temperatureEstimated}
                  onCheckedChange={(checked) => updateFormData('temperatureEstimated', checked === true)}
                />
                <Label htmlFor="max-temp-estimated" className="text-sm font-normal cursor-pointer">
                  {ESTIMATION_LABEL}
                </Label>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">温度均匀性</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源表面温度分布情况的主观感受。</p>
              </div>
              <RadioGroup
                value={formData.temperatureUniformity}
                onValueChange={(value) => updateFormData('temperatureUniformity', value)}
                className="grid gap-3"
              >
                {TEMPERATURE_UNIFORMITY_BASE_OPTIONS.map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`temp-uniformity-${option}`} />
                    <Label 
                      htmlFor={`temp-uniformity-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="temp-uniformity-estimated"
                  checked={formData.temperatureUniformityEstimated}
                  onCheckedChange={(checked) => updateFormData('temperatureUniformityEstimated', checked === true)}
                />
                <Label htmlFor="temp-uniformity-estimated" className="text-sm font-normal cursor-pointer">
                  {ESTIMATION_LABEL}
                </Label>
              </div>
              <div className="grid gap-4 sm:grid-cols-3 mt-4">
                {[
                  {
                    src: '/images/submission/temperature-uniformity/extremely-uneven.png',
                    alt: '温度极不均匀示例',
                    caption: '极不均匀示例'
                  },
                  {
                    src: '/images/submission/temperature-uniformity/moderately-even.png',
                    alt: '温度较均匀示例',
                    caption: '较均匀示例'
                  },
                  {
                    src: '/images/submission/temperature-uniformity/highly-even.png',
                    alt: '温度很均匀示例',
                    caption: '很均匀示例'
                  }
                ].map(({ src, alt, caption }) => (
                  <figure key={src} className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="relative aspect-[4/3] overflow-hidden rounded-md">
                      <Image src={src} alt={alt} fill className="object-cover" sizes="(min-width: 1024px) 200px, 33vw" />
                    </div>
                    <figcaption className="mt-2 text-center text-xs text-gray-600">{caption}</figcaption>
                  </figure>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">温控策略</Label>
                <p className="text-xs text-muted-foreground mt-1">在所有自充电/输出场景下的温控策略。（该选项为多选）</p>
              </div>
              <div className="grid gap-3">
                {THERMAL_CONTROL_OPTIONS.map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`thermal-${option}`}
                      checked={formData.thermalControlStrategy.includes(option)}
                      onCheckedChange={() => toggleArrayValue('thermalControlStrategy', option)}
                    />
                    <Label 
                      htmlFor={`thermal-${option}`} 
                      className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">最大纹波 (mV)</Label>
                <p className="text-xs text-muted-foreground mt-1">任意输出工况下纹波的最大值。</p>
              </div>
              <RadioGroup
                value={formData.maxRipple}
                onValueChange={(value) => updateFormData('maxRipple', value)}
                className="grid gap-3"
              >
                {RIPPLE_BASE_OPTIONS.map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`ripple-${option}`} />
                    <Label 
                      htmlFor={`ripple-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="ripple-estimated"
                  checked={formData.maxRippleEstimated}
                  onCheckedChange={(checked) => updateFormData('maxRippleEstimated', checked === true)}
                />
                <Label htmlFor="ripple-estimated" className="text-sm font-normal cursor-pointer">
                  {ESTIMATION_LABEL}
                </Label>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">协议支持性</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">PD固定档支持性</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源任意接口对PD协议的支持性中，有关固定电压档位的部分。（可进行多选）</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['不支持PD协议', '5V', '9V', '12V', '15V', '20V', '28V'].map(option => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`pd-fixed-${option}`}
                      checked={formData.pdFixedVoltageSupport.includes(option)}
                      onCheckedChange={() => toggleOptionWithExclusive('pdFixedVoltageSupport', option, '不支持PD协议')}
                    />
                    <Label 
                      htmlFor={`pd-fixed-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">PD PPS支持性</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源任意接口对PD协议的支持性中，有关PPS的部分。</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="pd-pps-none"
                    checked={formData.pdPpsSupport.includes('不支持PPS')}
                    onCheckedChange={(checked) => {
                      setFormData(prev => {
                        const current = prev.pdPpsSupport || [];
                        if (checked) {
                          return {
                            ...prev,
                            pdPpsSupport: ['不支持PPS'],
                          };
                        }
                        return {
                          ...prev,
                          pdPpsSupport: current.filter(item => item !== '不支持PPS'),
                        };
                      });
                      if (checked) {
                        setPdPpsInput('');
                      }
                    }}
                  />
                  <Label htmlFor="pd-pps-none" className="text-sm font-normal cursor-pointer">
                    不支持PPS
                  </Label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="text"
                    placeholder="例：5-11V 6.1A"
                    className="sm:flex-1"
                    value={pdPpsInput}
                    onChange={(e) => setPdPpsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPdPps();
                      }
                    }}
                    disabled={formData.pdPpsSupport.includes('不支持PPS')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPdPps}
                    disabled={formData.pdPpsSupport.includes('不支持PPS')}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 添加档位
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.pdPpsSupport.filter(item => item !== '不支持PPS').map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      {item}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArrayValue('pdPpsSupport', item)}
                        className="h-auto p-0 text-primary/70 hover:text-primary"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">QC支持性</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源任意接口对QC协议的支持性。仅包括对QC2.0、QC3.0的支持。</p>
              </div>
              <div className="grid gap-3">
                {['不支持QC协议', 'QC2.0', 'QC3.0'].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`qc-${option}`}
                      checked={formData.qcSupport.includes(option)}
                      onCheckedChange={() => toggleOptionWithExclusive('qcSupport', option, '不支持QC协议')}
                    />
                    <Label 
                      htmlFor={`qc-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">UFCS支持性</Label>
                <p className="text-xs text-muted-foreground mt-1">如支持UFCS，请填写具体档位或功率信息，可输入多组。</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="ufcs-none"
                    checked={formData.ufcsSupport.includes('不支持UFCS')}
                    onCheckedChange={(checked) => {
                      setFormData(prev => {
                        const current = prev.ufcsSupport || [];
                        if (checked) {
                          return {
                            ...prev,
                            ufcsSupport: ['不支持UFCS'],
                          };
                        }
                        return {
                          ...prev,
                          ufcsSupport: current.filter(item => item !== '不支持UFCS'),
                        };
                      });
                      if (checked) {
                        setUfcsInput('');
                      }
                    }}
                  />
                  <Label htmlFor="ufcs-none" className="text-sm font-normal cursor-pointer">
                    不支持UFCS
                  </Label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="text"
                    placeholder="例：UFCS 40W"
                    className="sm:flex-1"
                    value={ufcsInput}
                    onChange={(e) => setUfcsInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddUfcs();
                      }
                    }}
                    disabled={formData.ufcsSupport.includes('不支持UFCS')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddUfcs}
                    disabled={formData.ufcsSupport.includes('不支持UFCS')}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 添加档位
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.ufcsSupport.filter(item => item !== '不支持UFCS').map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      {item}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArrayValue('ufcsSupport', item)}
                        className="h-auto p-0 text-primary/70 hover:text-primary"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">私有协议支持性</Label>
                <p className="text-xs text-muted-foreground mt-1">请填写支持的私有协议名称及功率，可输入多组。</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="private-protocol-none"
                    checked={formData.privateProtocolSupport.includes('不支持私有协议')}
                    onCheckedChange={(checked) => {
                      setFormData(prev => {
                        const current = prev.privateProtocolSupport || [];
                        if (checked) {
                          return {
                            ...prev,
                            privateProtocolSupport: ['不支持私有协议'],
                          };
                        }
                        return {
                          ...prev,
                          privateProtocolSupport: current.filter(item => item !== '不支持私有协议'),
                        };
                      });
                      if (checked) {
                        setPrivateProtocolInput('');
                      }
                    }}
                  />
                  <Label htmlFor="private-protocol-none" className="text-sm font-normal cursor-pointer">
                    不支持私有协议
                  </Label>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Input
                    type="text"
                    placeholder="例：SuperVOOC 100W"
                    className="sm:flex-1"
                    value={privateProtocolInput}
                    onChange={(e) => setPrivateProtocolInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPrivateProtocol();
                      }
                    }}
                    disabled={formData.privateProtocolSupport.includes('不支持私有协议')}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddPrivateProtocol}
                    disabled={formData.privateProtocolSupport.includes('不支持私有协议')}
                  >
                    <Plus className="w-4 h-4 mr-1" /> 添加协议
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.privateProtocolSupport.filter(item => item !== '不支持私有协议').map((item, index) => (
                    <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
                      {item}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleArrayValue('privateProtocolSupport', item)}
                        className="h-auto p-0 text-primary/70 hover:text-primary"
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-900">潜在协议冲突</Label>
              <p className="text-xs text-muted-foreground">如果不同协议之间存在冲突或互斥，请在此描述；若无冲突可留空或填入“不存在潜在冲突”。</p>
              <Input
                type="text"
                value={formData.potentialProtocolConflicts}
                onChange={(e) => updateFormData('potentialProtocolConflicts', e.target.value)}
                placeholder="例：C1接口同时具有PPS与UFCS协议"
              />
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">多接口使用</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">双接口同时输出能力</Label>
              </div>
              <RadioGroup
                value={formData.dualPortOutputCapability}
                onValueChange={(value) => updateFormData('dualPortOutputCapability', value)}
                className="grid gap-3"
              >
                {[
                  '仅具有一个输出接口，或无法双接口同时输出',
                  '双接口同时输出总功率小于单口最大输出功率的20%，或同时输出总功率小于20W',
                  '双接口同时输出总功率大于单口最大输出功率的40%，小于60%',
                  '双接口同时输出总功率大于单口最大输出功率的60%，小于80%',
                  '双接口同时输出总功率大于单口最大输出功率的80%，小于100%',
                  '双接口同时输出总功率大于单口最大输出功率的100%，小于150%',
                  '双接口同时输出总功率大于单口最大输出功率的150%'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`dual-output-${option}`} />
                    <Label 
                      htmlFor={`dual-output-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">双接口边充边放</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源在自充电的同时进行输出的能力。</p>
              </div>
              <RadioGroup
                value={formData.dualPortPassthrough}
                onValueChange={(value) => updateFormData('dualPortPassthrough', value)}
                className="grid gap-3"
              >
                {[
                  '仅具有一个输出输出接口，或无法双接口边充边放',
                  '在任意条件下，充电功率等于输出功率。或输入/输出功率均小于15W',
                  '充电功率大于输出功率，且输入能达到仅输入模式的30%以上，输出能达到仅输出模式的30%以上',
                  '充电功率大于输出功率，且输入能达到仅输入模式的50%以上，输出能达到仅输出模式的50%以上',
                  '输入功率与输出功率相互独立，均能达到或超过单接口使用时的最大值'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`dual-passthrough-${option}`} />
                    <Label 
                      htmlFor={`dual-passthrough-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">双接口使用时的"不断联"能力</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源在双接口同时输出或边充边放场景下的插拔不断联能力。（可进行多选）</p>
              </div>
              <div className="grid gap-3">
                {[
                  '仅具有一个输出输出接口，或无法双接口同时使用/边充边放',
                  '具有双接口同时输出或边充边放能力，但任意条件下插拔接口均会造成断联',
                  '同时输出时，接口插拔不断联',
                  '边充边放时，接口插拔不断联'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`dual-disconnect-${option}`}
                      checked={formData.dualPortNoDisconnect.includes(option)}
                      onCheckedChange={() => toggleArrayValue('dualPortNoDisconnect', option)}
                    />
                    <Label 
                      htmlFor={`dual-disconnect-${option}`} 
                      className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">信息显示与其他功能</h3>
            
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">显示内容</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源的信息显示种类。（可进行多选）</p>
              </div>
              <div className="grid gap-3">
                {[
                  '不具有以下内容的显示能力',
                  '支持显示电量百分比（精确到1%或更高）',
                  '支持功率显示',
                  '支持电池信息显示（包括温度、电池健康等任一数据即可）',
                  '支持显示预估的剩余输入/输出时间，且预估较为精准（偏差值在30%以内）'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`display-content-${option}`}
                      checked={formData.displayContent.includes(option)}
                      onCheckedChange={() => toggleOptionWithExclusive('displayContent', option, '不具有以下内容的显示能力')}
                    />
                    <Label 
                      htmlFor={`display-content-${option}`} 
                      className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">显示载体</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源的主要信息显示载体。</p>
              </div>
              <RadioGroup
                value={formData.displayCarrier}
                onValueChange={(value) => updateFormData('displayCarrier', value)}
                className="grid gap-3"
              >
                {[
                  '不具有任何显示载体',
                  '单个LED指示灯',
                  '多个LED指示灯',
                  '数码管',
                  'TFT显示屏'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`display-carrier-${option}`} />
                    <Label 
                      htmlFor={`display-carrier-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">显示亮度</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源的主要信息显示载体在户外强光环境下的可视性。</p>
              </div>
              <RadioGroup
                value={formData.displayBrightness}
                onValueChange={(value) => updateFormData('displayBrightness', value)}
                className="grid gap-3"
              >
                {[
                  '不具有任何显示载体',
                  '可视性差（无法看清）',
                  '可视性好'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`display-brightness-${option}`} />
                    <Label 
                      htmlFor={`display-brightness-${option}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">显示自定义能力</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源在信息显示方面的自定义调节功能。（可进行多选）</p>
              </div>
              <div className="grid gap-3">
                {DISPLAY_CUSTOMIZATION_OPTIONS.map((option, index) => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`display-customization-${index}`}
                      checked={formData.displayCustomization.includes(option)}
                      onCheckedChange={() => toggleOptionWithExclusive('displayCustomization', option, '不具有任何显示载体，或不具备任何下列自定义调节能力')}
                    />
                    <Label 
                      htmlFor={`display-customization-${index}`} 
                      className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">接口方向自定义</Label>
                <p className="text-xs text-muted-foreground mt-1">对某些接口指定输入或输出方向的能力。</p>
              </div>
              <RadioGroup
                value={formData.portDirectionCustomization}
                onValueChange={(value) => updateFormData('portDirectionCustomization', value)}
                className="grid gap-3"
              >
                {PORT_DIRECTION_OPTIONS.map((option, index) => (
                  <div key={option} className="flex items-center space-x-3">
                    <RadioGroupItem value={option} id={`port-direction-${index}`} />
                    <Label 
                      htmlFor={`port-direction-${index}`} 
                      className="text-sm font-normal cursor-pointer"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              <figure className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                <div className="relative aspect-video overflow-hidden rounded-md">
                  <Image
                    src="/images/submission/port-direction/port-direction-example.jpeg"
                    alt="接口输入输出方向自定义示例"
                    fill
                    className="object-cover"
                    sizes="(min-width: 1024px) 400px, 80vw"
                  />
                </div>
                <figcaption className="mt-2 text-center text-xs text-gray-600">
                  接口方向自定义示例图
                </figcaption>
              </figure>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-900">IoT能力</Label>
                <p className="text-xs text-muted-foreground mt-1">移动电源的物联网接入能力，及其远程控制功能。</p>
              </div>
              <div className="grid gap-3">
                {[
                  '不支持IoT接入（蓝牙、Wi-Fi等）能力，或不具备任何下列功能',
                  '支持异地远程控制（支持Wi-Fi）',
                  '支持电量查看',
                  '支持功率查看',
                  '支持电池健康查看或电池健康保护功能',
                  '支持蓝牙查找（配备蜂鸣器）',
                  '支持接入查找网络（Apple Find My、华为"查找"网络等）'
                ].map(option => (
                  <div key={option} className="flex items-center space-x-3">
                    <Checkbox
                      id={`iot-${option}`}
                      checked={formData.iotCapabilities.includes(option)}
                      onCheckedChange={() => toggleOptionWithExclusive('iotCapabilities', option, '不支持IoT接入（蓝牙、Wi-Fi等）能力，或不具备任何下列功能')}
                    />
                    <Label 
                      htmlFor={`iot-${option}`} 
                      className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 9:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6">您的产品评价与个人信息</h3>
            
            <div className="space-y-2">
              <Label htmlFor="advantages" className="text-sm font-medium text-gray-900">您认为该产品具有哪些优点</Label>
              <Textarea
                id="advantages"
                value={formData.advantages}
                onChange={(e) => updateFormData('advantages', e.target.value)}
                rows={4}
                placeholder="请描述产品的优点..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="disadvantages" className="text-sm font-medium text-gray-900">您认为该产品具有哪些缺点</Label>
              <Textarea
                id="disadvantages"
                value={formData.disadvantages}
                onChange={(e) => updateFormData('disadvantages', e.target.value)}
                rows={4}
                placeholder="请描述产品的缺点..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterName" className="text-sm font-medium text-gray-900">您的昵称 *</Label>
              <p className="text-xs text-muted-foreground">用于在使用您提供的相关数据时注明来源。</p>
              <Input
                id="submitterName"
                type="text"
                value={formData.submitterName}
                onChange={(e) => updateFormData('submitterName', e.target.value)}
                className={cn(
                  errors.submitterName && "border-destructive focus-visible:ring-destructive"
                )}
                placeholder="您的昵称"
              />
              {errors.submitterName && (
                <p className="text-destructive text-xs">{errors.submitterName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitterContact" className="text-sm font-medium text-gray-900">您的联系方式</Label>
              <p className="text-xs text-muted-foreground">（可选）用于参与随机抽奖活动。（建议使用"QQ 1234567"、"手机 18712341234"格式）</p>
              <Input
                id="submitterContact"
                type="text"
                value={formData.submitterContact}
                onChange={(e) => updateFormData('submitterContact', e.target.value)}
                placeholder="QQ 1234567 或 手机 18712341234"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes" className="text-sm font-medium text-gray-900">其他任意问题或建议</Label>
              <Textarea
                id="additionalNotes"
                value={formData.additionalNotes}
                onChange={(e) => updateFormData('additionalNotes', e.target.value)}
                rows={4}
                placeholder="任何其他补充信息..."
              />
            </div>

            {submitStatus === 'error' && (
              <div className="p-4 bg-destructive/15 border border-destructive/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <p className="text-destructive">{submitError || '提交失败，请检查网络连接或稍后重试。'}</p>
                </div>
              </div>
            )}
          </div>
        );

      case 10:
        return (
          <div className="text-center py-12">
            <div className="mb-8">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">提交成功！</h3>
              <p className="text-gray-600">
                我们已经收到了您提交的数据，非常感谢您的耐心参与！
              </p>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <p className="text-green-800 text-sm">
                您的数据将在审核后添加到我们的数据库中，这有助于其他用户更好地了解和比较充电宝产品。
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* 页面标题 */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">充电宝产品数据提交</h1>
        <p className="text-gray-600">请按照以下步骤填写详细的产品测试数据</p>
      </div>

      {/* 进度指示器 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            步骤 {currentStep} / {steps.length}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / steps.length) * 100)}% 完成
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          ></div>
        </div>
        <div className="mt-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {steps[currentStep - 1]?.title}
          </h2>
          <p className="text-sm text-gray-600">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* 表单内容 */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg shadow-black/5 p-6 sm:p-8 mb-8">
        <div className="min-h-[400px]">
          {renderStepContent()}
        </div>
      </div>

      {/* 导航按钮 */}
      {currentStep < 10 && (
        <div className="flex justify-between items-center">
          <Button
            type="button"
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2"
          >
            上一步
          </Button>

          {currentStep < 9 ? (
            <Button
              type="button"
              onClick={nextStep}
              className="px-6 py-2"
            >
              下一步
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !formData.submitterName}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  提交中...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  提交数据
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
