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
  // 基础属性，使用与主数据库类似的结构
  const properties: any = {
    // 基本信息 - 使用 Model 作为标题字段（从数据库结构看出这是title类型）
    'Model': {
      title: [{ text: { content: data.model || '未命名产品' } }]
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
          properties[name] = { number: Number(value) || 0 };
          break;
        case 'multi_select':
          if (Array.isArray(value) && value.length > 0) {
            properties[name] = { multi_select: value.map(v => ({ name: String(v) })) };
          }
          break;
        case 'select':
          properties[name] = { select: { name: String(value) } };
          break;
        case 'date':
          properties[name] = { date: { start: String(value) } };
          break;
        case 'files':
          if (typeof value === 'string' && value.startsWith('http')) {
            properties[name] = { files: [{ external: { url: value } }] };
          }
          break;
        case 'url':
          if (typeof value === 'string' && value.startsWith('http')) {
            properties[name] = { url: value };
          }
          break;
      }
    }
  };

  // 基本信息 - 使用实际存在的属性名
  safeAddProperty('品牌', 'rich_text', data.brand);
  safeAddProperty('Title', 'rich_text', data.title);
  safeAddProperty('Subtitle', 'rich_text', data.subtitle);
  safeAddProperty('Tags', 'multi_select', data.tags);
  safeAddProperty('Price', 'number', data.price);
  safeAddProperty('ReleaseDate', 'date', data.releaseDate);
  
  // 图片 - 尝试不同的属性名和类型
  if (data.imageUrl) {
    safeAddProperty('图片', 'files', data.imageUrl);
    safeAddProperty('Image', 'files', data.imageUrl);
    safeAddProperty('产品图片', 'files', data.imageUrl);
  }

  // 评分数据 - 使用实际存在的属性名
  safeAddProperty('OverallRating', 'number', data.overallRating);
  safeAddProperty('PerformanceRating', 'number', data.performanceRating);
  safeAddProperty('ExperienceRating', 'number', data.experienceRating);
  safeAddProperty('SelfChargingCapability', 'number', data.selfChargingCapability);
  safeAddProperty('OutputCapability', 'number', data.outputCapability);
  safeAddProperty('Energy', 'number', data.energy);
  safeAddProperty('Portability', 'number', data.portability);
  safeAddProperty('ChargingProtocols', 'number', data.chargingProtocols);
  safeAddProperty('MultiPortUsage', 'number', data.multiPortUsage);

  // 技术参数
  safeAddProperty('长度（cm）', 'number', data.detailData.length);
  safeAddProperty('宽度（cm）', 'number', data.detailData.width);
  safeAddProperty('厚度（cm）', 'number', data.detailData.thickness);
  safeAddProperty('重量（g）', 'number', data.detailData.weight);
  safeAddProperty('体积（cm3）', 'number', data.detailData.volume);
  safeAddProperty('容量级别（mAh）', 'number', data.detailData.capacityLevel);
  safeAddProperty('最大放电容量（Wh）', 'number', data.detailData.maxDischargeCapacity);
  safeAddProperty('自充能量（Wh）', 'number', data.detailData.selfChargingEnergy);
  safeAddProperty('最大自充电功率', 'number', data.detailData.maxSelfChargingPower);
  safeAddProperty('最大输出功率', 'number', data.detailData.maxOutputPower);
  safeAddProperty('自充时间（min）', 'number', data.detailData.selfChargingTime);
  safeAddProperty('平均自充功率（W）', 'number', data.detailData.avgSelfChargingPower);
  safeAddProperty('20分钟充入能量（Wh）', 'number', data.detailData.energy20min);
  safeAddProperty('最大持续输出平均功率（W）', 'number', data.detailData.maxContinuousOutputPower);

  // 优劣势 - 使用实际存在的属性名
  safeAddProperty('Advantages', 'rich_text', data.advantages.join('\n'));
  safeAddProperty('Disadvantages', 'rich_text', data.disadvantages.join('\n'));

  // 投稿人信息 - 在数据来源字段包含所有信息
  const submitterInfo = `${data.detailData.dataSource || data.submitterName}\n投稿人: ${data.submitterName}\n邮箱: ${data.submitterEmail}\n备注: ${data.submitterNote}`;
  safeAddProperty('数据来源', 'rich_text', submitterInfo);
  
  // 时间戳
  safeAddProperty('CreatedAt', 'date', new Date().toISOString());

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
    if (!data.brand || !data.model || !data.title || !data.submitterName || !data.submitterEmail) {
      return NextResponse.json(
        { error: '必填字段不能为空：品牌、型号、标题、投稿人姓名、邮箱' },
        { status: 400 }
      );
    }

    // 邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.submitterEmail)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
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