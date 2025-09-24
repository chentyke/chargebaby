#!/usr/bin/env node

/**
 * 图片缓存优化测试脚本
 * 测试EdgeOne CDN缓存命中率改进
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

// 测试用的Notion图片URL（示例）
const TEST_IMAGE_URLS = [
  'https://prod-files-secure.s3.us-west-2.amazonaws.com/example-id-1/image1.jpg',
  'https://prod-files-secure.s3.us-west-2.amazonaws.com/example-id-2/image2.png',
  'https://www.notion.so/image/example-id-3.webp'
];

async function testImageProxy(imageUrl, params = {}) {
  const searchParams = new URLSearchParams({
    url: imageUrl,
    ...params
  });
  
  const testUrl = `${BASE_URL}/api/image-proxy?${searchParams}`;
  
  console.log(`Testing: ${testUrl}`);
  
  try {
    const start = Date.now();
    const response = await fetch(testUrl);
    const duration = Date.now() - start;
    
    const headers = {
      'cache-status': response.headers.get('x-cache-status'),
      'etag': response.headers.get('etag'),
      'content-type': response.headers.get('content-type'),
      'cache-control': response.headers.get('cache-control'),
      'image-id': response.headers.get('x-image-id'),
      'vary': response.headers.get('vary'),
    };
    
    console.log(`  Status: ${response.status}`);
    console.log(`  Duration: ${duration}ms`);
    console.log(`  Headers:`, headers);
    console.log(`  Content-Length: ${response.headers.get('content-length')}`);
    console.log('---');
    
    return {
      url: testUrl,
      status: response.status,
      duration,
      headers,
      success: response.ok
    };
  } catch (error) {
    console.error(`  Error: ${error.message}`);
    return {
      url: testUrl,
      error: error.message,
      success: false
    };
  }
}

async function testCacheConsistency() {
  console.log('🧪 Testing Image Proxy Cache Optimization\n');
  
  const results = [];
  
  // 测试1: 基础缓存功能
  console.log('📋 Test 1: Basic Cache Function');
  const basicTest = await testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium' });
  results.push(basicTest);
  
  // 测试2: 相同图片不同尺寸（测试ETag一致性）
  console.log('📋 Test 2: Same Image Different Sizes');
  const sizeTests = await Promise.all([
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'small' }),
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium' }),
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'large' })
  ]);
  results.push(...sizeTests);
  
  // 测试3: 质量参数标准化
  console.log('📋 Test 3: Quality Parameter Normalization');
  const qualityTests = await Promise.all([
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium', q: 83 }), // 应该标准化为85
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium', q: 85 }), // 标准值
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium', q: 87 }), // 应该标准化为85
  ]);
  results.push(...qualityTests);
  
  // 测试4: 重复请求（测试缓存命中）
  console.log('📋 Test 4: Cache Hit Test (Repeat Requests)');
  const cacheHitTests = await Promise.all([
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium' }),
    testImageProxy(TEST_IMAGE_URLS[0], { size: 'medium' }),
  ]);
  results.push(...cacheHitTests);
  
  // 分析结果
  console.log('\n📊 Test Results Analysis:');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful requests: ${successful.length}/${results.length}`);
  console.log(`❌ Failed requests: ${failed.length}/${results.length}`);
  
  if (successful.length > 0) {
    const avgDuration = successful.reduce((sum, r) => sum + r.duration, 0) / successful.length;
    console.log(`⏱️  Average response time: ${avgDuration.toFixed(0)}ms`);
    
    const cacheStatuses = {};
    successful.forEach(r => {
      const status = r.headers['cache-status'] || 'unknown';
      cacheStatuses[status] = (cacheStatuses[status] || 0) + 1;
    });
    
    console.log(`📈 Cache Status Distribution:`, cacheStatuses);
    
    // 检查ETag一致性
    const etags = successful.map(r => r.headers.etag).filter(Boolean);
    const uniqueETags = [...new Set(etags)];
    console.log(`🏷️  Unique ETags: ${uniqueETags.length} (should be fewer for better caching)`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Requests:');
    failed.forEach(r => {
      console.log(`  - ${r.url}: ${r.error}`);
    });
  }
  
  return results;
}

// 如果直接运行此脚本
if (require.main === module) {
  testCacheConsistency().then(() => {
    console.log('\n✅ Cache optimization test completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testCacheConsistency, testImageProxy };