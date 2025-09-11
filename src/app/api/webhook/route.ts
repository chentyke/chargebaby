import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { serverCache, CACHE_KEYS } from '@/lib/cache';

// Webhook事件类型
interface WebhookEvent {
  id: string;
  timestamp: string;
  type: string;
  entity: {
    id: string;
    type: string;
  };
  workspace_id?: string;
  workspace_name?: string;
  subscription_id?: string;
  integration_id?: string;
  authors?: any[];
  attempt_number?: number;
  api_version?: string;
  data?: any;
}

// 验证令牌事件
interface VerificationEvent {
  verification_token: string;
}

// 环境变量
const WEBHOOK_SECRET = process.env.NOTION_WEBHOOK_SECRET;

/**
 * 验证webhook签名
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = `sha256=${createHmac('sha256', secret)
    .update(body)
    .digest('hex')}`;

  return timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
}

/**
 * 处理webhook事件
 */
function handleWebhookEvent(event: WebhookEvent): void {
  console.log('📡 Received webhook event:', {
    type: event.type,
    objectType: event.entity?.type || 'unknown',
    objectId: event.entity?.id || 'unknown',
    timestamp: event.timestamp,
  });

  // 安全检查 entity 是否存在
  if (!event.entity) {
    console.warn('⚠️ Webhook event missing entity data:', JSON.stringify(event, null, 2));
    return;
  }

  switch (event.type) {
    case 'page.content_updated':
    case 'page.properties_updated':
      // 页面内容或属性更新 - 智能缓存失效
      if (event.entity.type === 'page') {
        const pageId = event.entity.id;
        console.log('🔄 Page updated, clearing cache for:', pageId);
        serverCache.invalidatePageCache(pageId);
      }
      break;

    case 'data_source.schema_updated':
    case 'database.schema_updated':
      // 数据库结构更新 - 清除所有相关缓存
      console.log('🏗️ Database schema updated, clearing all caches');
      serverCache.invalidateSchemaCache();
      break;

    case 'comment.created':
      // 评论创建 - 通常不需要清除产品数据缓存
      console.log('💬 New comment created on:', event.entity.id);
      break;

    default:
      console.log('❓ Unhandled webhook event type:', event.type);
      console.log('📋 Full event data:', JSON.stringify(event, null, 2));
  }
}

/**
 * POST - 接收webhook事件
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('X-Notion-Signature');

    // 解析请求体
    let payload: WebhookEvent | VerificationEvent;
    try {
      payload = JSON.parse(body);
    } catch (error) {
      console.error('❌ Invalid JSON in webhook payload');
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }

    // 检查是否是验证事件
    if ('verification_token' in payload) {
      const verificationEvent = payload as VerificationEvent;
      console.log('🔐 Received webhook verification token');
      console.log('📝 Verification Token:', verificationEvent.verification_token);
      console.log('🔑 Copy this token to Notion:', verificationEvent.verification_token);
      
      // 如果配置了webhook secret，验证签名
      if (WEBHOOK_SECRET && signature) {
        const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
        if (!isValid) {
          console.error('❌ Invalid webhook signature for verification');
          return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 401 }
          );
        }
      }
      
      // 返回200确认接收到验证令牌
      return NextResponse.json({
        success: true,
        message: 'Verification token received',
        verification_token: verificationEvent.verification_token,
        timestamp: new Date().toISOString(),
      });
    }

    // 处理正常的webhook事件
    const event = payload as WebhookEvent;
    
    // 如果配置了webhook secret，验证签名
    if (WEBHOOK_SECRET) {
      if (!signature) {
        console.error('❌ Missing signature header');
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 401 }
        );
      }

      const isValid = verifyWebhookSignature(body, signature, WEBHOOK_SECRET);
      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('⚠️  Webhook secret not configured, skipping signature verification');
    }

    // 处理webhook事件
    handleWebhookEvent(event);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      eventType: event.type,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET - 健康检查和状态查询
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  switch (action) {
    case 'health':
      return NextResponse.json({
        status: 'healthy',
        webhook_secret_configured: !!WEBHOOK_SECRET,
        supported_events: [
          'page.content_updated',
          'page.properties_updated',
          'data_source.schema_updated',
          'database.schema_updated',
          'comment.created',
        ],
        endpoints: {
          POST: 'Receive webhook events',
          'GET?action=health': 'Health check',
          'GET?action=test': 'Test webhook (dev only)',
        },
        environment: process.env.NODE_ENV || 'unknown',
        timestamp: new Date().toISOString(),
      });

    case 'test':
      // 测试webhook处理（仅开发环境）
      if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json(
          { error: 'Test endpoint only available in development' },
          { status: 403 }
        );
      }

      // 模拟webhook事件
      const testEvent: WebhookEvent = {
        id: 'test-event-id',
        timestamp: new Date().toISOString(),
        type: 'page.properties_updated',
        entity: {
          type: 'page',
          id: 'test-page-id',
        },
      };

      handleWebhookEvent(testEvent);

      return NextResponse.json({
        success: true,
        message: 'Test webhook event processed',
        event: testEvent,
        timestamp: new Date().toISOString(),
      });

    default:
      return NextResponse.json({
        message: 'Notion Webhook Endpoint',
        status: 'ready',
        webhook_secret_configured: !!WEBHOOK_SECRET,
        supported_events: [
          'page.content_updated',
          'page.properties_updated',
          'data_source.schema_updated',
          'database.schema_updated',
          'comment.created',
        ],
        endpoints: {
          POST: 'Receive webhook events',
          'GET?action=health': 'Health check',
          'GET?action=test': 'Test webhook (dev only)',
        },
        timestamp: new Date().toISOString(),
      });
  }
}
