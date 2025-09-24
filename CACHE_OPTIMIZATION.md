# Image Proxy CDN缓存优化

## 问题分析

EdgeOne CDN缓存命中率低的主要原因：

1. **缓存键不稳定** - 不同参数组合产生过多缓存变体
2. **缺少ETag** - CDN无法识别相同内容
3. **URL参数碎片化** - 微小的参数差异导致缓存失效

## 优化措施

### 1. 稳定的缓存键生成 (`src/lib/image-cache.ts`)

```typescript
// 优化前：基于完整URL + 所有参数
`image:${hash(baseUrl + resolutionSuffix)}`

// 优化后：基于稳定的图片ID + 标准化参数  
`image:${imageId}:${width}x${height}:q${normalizedQuality}`
```

**改进点：**
- 从Notion图片URL中提取稳定的图片ID
- 质量参数标准化（95/85/75/65）减少变体
- 更可预测的缓存键生成

### 2. ETag支持 (`src/app/api/image-proxy/route.ts`)

```typescript
// 新增：稳定的ETag生成
const etag = ImageCache.generateETag(imageUrl, resolutionConfig);

// 304响应支持
if (ifNoneMatch === etag) {
  return new NextResponse(null, { status: 304 });
}
```

**改进点：**
- 基于图片ID和配置生成稳定ETag
- 支持客户端条件请求（304 Not Modified）
- CDN可以基于ETag进行缓存验证

### 3. 优化的缓存头

```typescript
// 优化前
'Cache-Control': 'public, max-age=604800, s-maxage=604800' // 7天

// 优化后  
'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable' // 30天 + immutable
'ETag': '"image-id-config-hash"'
'Vary': 'Accept'
'Last-Modified': new Date().toUTCString()
```

**改进点：**
- 延长缓存时间到30天
- 添加`immutable`指令提高缓存效率
- `Vary: Accept`支持内容协商
- 完整的缓存验证头

### 4. URL参数标准化 (`src/components/notion-image.tsx`)

```typescript
// 优化前：所有参数都传递
params.set('size', targetSize);
params.set('q', quality.toString());

// 优化后：只传递非默认值
if (targetSize && targetSize !== 'medium') {
  params.set('size', targetSize);
}
if (normalizedQuality !== 85) {
  params.set('q', normalizedQuality.toString());
}
```

**改进点：**
- 质量参数标准化减少碎片
- 跳过默认值减少URL变体  
- 固定参数顺序确保URL一致性

### 5. 缓存状态追踪

新增缓存状态标识：
- `CLIENT-HIT` - 304响应
- `SERVER-HIT` - 服务端缓存命中
- `CDN-MISS` - 新请求，需要CDN缓存
- `FETCH-ERROR` - 获取失败

## 预期效果

1. **减少缓存变体** - 参数标准化减少90%+的重复缓存
2. **提高CDN命中率** - 稳定ETag和URL让CDN缓存更有效
3. **降低源站压力** - 更长的缓存时间和immutable指令
4. **更快的响应** - 304响应和CDN缓存命中

## 测试验证

运行测试脚本：
```bash
node scripts/test-image-cache.js
```

监控指标：
- EdgeOne CDN命中率应显著提升
- 服务端缓存命中率保持稳定
- 平均响应时间降低
- 源站请求数减少

## 部署后监控

关注以下指标：
1. `X-Cache-Status`分布变化
2. EdgeOne控制台的缓存命中率
3. 图片加载性能指标
4. 服务器负载情况