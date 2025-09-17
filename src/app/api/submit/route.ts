import { NextRequest, NextResponse } from 'next/server';

const notionApiBase = 'https://api.notion.com/v1';
const notionVersion = process.env.NOTION_VERSION || '2022-06-28';
const notionApiKey = process.env.NOTION_API_KEY;
const submissionDatabaseId = process.env.NOTION_SUBMISSION_DATABASE_ID;

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
    length: number;
    width: number;
    thickness: number;
    weight: number;
    volume: number;
    energyWeightRatio: number;
    energyVolumeRatio: number;
    capacityLevel: number;
    maxDischargeCapacity: number;
    selfChargingEnergy: number;
    dischargeCapacityAchievementRate: number;
    maxEnergyConversionRate: number;
    maxSelfChargingPower: number;
    selfChargingTime: number;
    avgSelfChargingPower: number;
    energy20min: number;
    maxOutputPower: number;
    maxContinuousOutputPower: number;
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

async function notionFetch<T>(path: string, init?: RequestInit): Promise<T> {
  if (!notionApiKey) throw new Error('NOTION_API_KEY is not set');
  
  const res = await fetch(`${notionApiBase}${path}`, {
    ...init,
    headers: {
      'Authorization': `Bearer ${notionApiKey}`,
      'Notion-Version': notionVersion,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Notion API ${res.status}: ${text}`);
  }
  
  return res.json() as Promise<T>;
}

function createNotionProperties(data: SubmissionData) {
  // 基础属性，使用实际数据库字段结构
  const properties: any = {
    // 基本信息 - 使用 名称 作为标题字段（title类型）
    '名称': {
      title: [{ text: { content: data.title || data.brand + ' ' + data.model || '未命名产品' } }]
    }
  };

  // 安全地添加属性，只有当值存在时才添加
  const safeAddProperty = (name: string, type: string, value: any) => {
    if (value !== null && value !== undefined && value !== '') {
      switch (type) {
        case 'rich_text':
          properties[name] = { rich_text: [{ text: { content: String(value) } }] };
          break;
        case 'number':
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            properties[name] = { number: numValue };
          }
          break;
        case 'select':
          properties[name] = { select: { name: String(value) } };
          break;
        case 'date':
          properties[name] = { date: { start: String(value) } };
          break;
      }
    }
  };

  // 从submitterNote中提取详细信息
  const submitterNote = data.submitterNote || '';
  const noteLines = submitterNote.split('\n');
  let extractedData: any = {};
  
  noteLines.forEach(line => {
    if (line.includes('线缆长度:')) extractedData.cableLength = line.split(':')[1]?.trim();
    if (line.includes('线缆柔软度:')) extractedData.cableFlexibility = line.split(':')[1]?.trim();
    if (line.includes('最高温度:')) extractedData.maxTemp = line.split(':')[1]?.trim();
    if (line.includes('温度均匀性:')) extractedData.tempUniformity = line.split(':')[1]?.trim();
    if (line.includes('温控策略:')) extractedData.thermalControl = line.split(':')[1]?.trim();
    if (line.includes('最大纹波:')) extractedData.ripple = line.split(':')[1]?.trim();
    if (line.includes('PD固定档支持:')) extractedData.pdSupport = line.split(':')[1]?.trim();
    if (line.includes('PD PPS支持:')) extractedData.ppsSupport = line.split(':')[1]?.trim();
    if (line.includes('QC支持:')) extractedData.qcSupport = line.split(':')[1]?.trim();
    if (line.includes('UFCS支持:')) extractedData.ufcsSupport = line.split(':')[1]?.trim();
    if (line.includes('私有协议支持:')) extractedData.privateProtocol = line.split(':')[1]?.trim();
    if (line.includes('双接口输出能力:')) extractedData.dualOutput = line.split(':')[1]?.trim();
    if (line.includes('双接口边冲边放:')) extractedData.dualPassthrough = line.split(':')[1]?.trim();
    if (line.includes('显示内容:')) extractedData.displayContent = line.split(':')[1]?.trim();
    if (line.includes('显示载体:')) extractedData.displayCarrier = line.split(':')[1]?.trim();
    if (line.includes('显示亮度:')) extractedData.displayBrightness = line.split(':')[1]?.trim();
    if (line.includes('IoT能力:')) extractedData.iot = line.split(':')[1]?.trim();
    if (line.includes('其他备注:')) extractedData.additionalNotes = line.split(':')[1]?.trim();
  });

  // 基本信息字段
  safeAddProperty('品牌', 'rich_text', data.brand);
  safeAddProperty('型号', 'rich_text', data.model);
  safeAddProperty('容量级别（mAh）', 'number', data.detailData.capacityLevel);

  // 物理规格字段
  safeAddProperty('长度（cm）', 'number', data.detailData.length);
  safeAddProperty('宽度（cm）', 'number', data.detailData.width);
  safeAddProperty('厚度（cm）', 'number', data.detailData.thickness);
  safeAddProperty('重量（g）', 'number', data.detailData.weight);
  safeAddProperty('线缆长度', 'rich_text', extractedData.cableLength || '没有附带不可拆卸的线缆');
  safeAddProperty('线缆柔软度', 'rich_text', extractedData.cableFlexibility || '没有附带不可拆卸的线缆');

  // 性能数据字段
  safeAddProperty('自充时间（min）', 'number', data.detailData.selfChargingTime);
  safeAddProperty('自充能量（Wh）', 'number', data.detailData.selfChargingEnergy);
  safeAddProperty('20分钟充入能量（Wh）', 'number', data.detailData.energy20min);
  safeAddProperty('最大持续输出平均功率（W）', 'number', data.detailData.maxContinuousOutputPower);
  safeAddProperty('最大放电容量（Wh）', 'number', data.detailData.maxDischargeCapacity);

  // 温度与纹波字段
  safeAddProperty('表面最高温度', 'rich_text', extractedData.maxTemp || '<44℃');
  safeAddProperty('温度均匀性', 'rich_text', extractedData.tempUniformity || '较均匀');
  safeAddProperty('温控策略', 'rich_text', extractedData.thermalControl || '仅根据温度限制自充/输出功率');
  safeAddProperty('最大纹波', 'rich_text', extractedData.ripple || '<50mV');

  // 协议支持字段
  safeAddProperty('PD固定档支持', 'select', extractedData.pdSupport?.split(',')[0]?.trim() || '不支持PD协议');
  safeAddProperty('PD_PPS支持', 'rich_text', extractedData.ppsSupport || '不支持PPS');
  safeAddProperty('QC支持', 'select', extractedData.qcSupport?.split(',')[0]?.trim() || '不支持QC协议');
  safeAddProperty('UFCS支持', 'select', extractedData.ufcsSupport || '不支持UFCS');
  safeAddProperty('私有协议支持', 'rich_text', extractedData.privateProtocol || '不支持私有协议');
  safeAddProperty('潜在协议冲突', 'select', '不存在潜在冲突');

  // 多接口使用字段
  safeAddProperty('双接口输出能力', 'rich_text', extractedData.dualOutput || '仅具有一个输出接口，或无法双接口同时输出');
  safeAddProperty('双接口边冲边放', 'rich_text', extractedData.dualPassthrough || '仅具有一个输出接口，或无法双接口边冲边放');
  safeAddProperty('双接口不断联能力', 'rich_text', '仅具有一个输出接口，或无法双接口同时使用');

  // 显示与功能字段
  safeAddProperty('显示内容', 'rich_text', extractedData.displayContent || '不具有以下内容的显示能力');
  safeAddProperty('显示载体', 'rich_text', extractedData.displayCarrier || '不具有任何显示载体');
  safeAddProperty('显示亮度', 'select', extractedData.displayBrightness || '不具有任何显示载体');
  safeAddProperty('显示自定义能力', 'rich_text', '不具备任何自定义调节能力');
  safeAddProperty('接口方向自定义', 'select', '不具有自定义特定接口输入输出方向的能力');
  safeAddProperty('IoT能力', 'rich_text', extractedData.iot || '不支持IoT接入');

  // 评价与投稿信息字段
  safeAddProperty('产品优点', 'rich_text', Array.isArray(data.advantages) ? data.advantages.join('\n') : String(data.advantages || ''));
  safeAddProperty('产品缺点', 'rich_text', Array.isArray(data.disadvantages) ? data.disadvantages.join('\n') : String(data.disadvantages || ''));
  safeAddProperty('投稿人昵称', 'rich_text', data.submitterName);
  safeAddProperty('联系方式', 'rich_text', data.submitterEmail || '未提供');
  safeAddProperty('测试环境说明', 'rich_text', '室内常温环境');
  safeAddProperty('其他备注', 'rich_text', extractedData.additionalNotes || data.submitterNote || '无');
  safeAddProperty('数据来源', 'select', '用户测试');
  
  // 时间戳
  safeAddProperty('提交时间', 'date', new Date().toISOString());

  return properties;
}

export async function POST(request: NextRequest) {
  try {
    if (!notionApiKey) {
      return NextResponse.json(
        { error: 'Notion API configuration missing' },
        { status: 500 }
      );
    }

    if (!submissionDatabaseId) {
      return NextResponse.json(
        { 
          error: '投稿功能暂未开放，管理员还未配置投稿数据库。请联系管理员配置 NOTION_SUBMISSION_DATABASE_ID 环境变量。',
          code: 'SUBMISSION_DB_NOT_CONFIGURED'
        },
        { status: 503 } // Service Unavailable
      );
    }

    const data: SubmissionData = await request.json();

    // 基本验证
    if (!data.brand || !data.title || !data.submitterName) {
      return NextResponse.json(
        { error: '必填字段不能为空：品牌、标题、投稿人姓名' },
        { status: 400 }
      );
    }

    // 邮箱格式验证（如果提供了邮箱）
    if (data.submitterEmail && data.submitterEmail !== 'no-email@provided.com') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.submitterEmail)) {
        return NextResponse.json(
          { error: '邮箱格式不正确' },
          { status: 400 }
        );
      }
    }

    // 创建 Notion 页面
    const notionProperties = createNotionProperties(data);
    
    const response = await notionFetch(`/pages`, {
      method: 'POST',
      body: JSON.stringify({
        parent: { database_id: submissionDatabaseId },
        properties: notionProperties,
      }),
    });

    console.log('Submission created successfully:', response);

    return NextResponse.json(
      { 
        success: true, 
        message: '投稿成功！感谢您的贡献，我们会尽快审核您的提交。',
        id: (response as any).id 
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating submission:', error);
    
    let errorMessage = '提交失败，请稍后重试';
    
    if (error instanceof Error) {
      if (error.message.includes('400')) {
        errorMessage = '请检查数据格式是否正确';
      } else if (error.message.includes('401')) {
        errorMessage = '认证失败，请联系管理员';
      } else if (error.message.includes('404')) {
        errorMessage = '数据库配置错误，请联系管理员';
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}