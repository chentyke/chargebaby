# 图片问题排查指南

## 快速诊断

你遇到的具体问题：
```
https://chargebaby.tykeui.top/_next/image?url=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F...
```

**问题原因**: Next.js 图片优化器试图处理已过期的 Notion 图片链接

**解决方案**: 我们的图片代理系统会自动绕过 Next.js 优化器，直接处理 Notion 图片

## 验证修复

### 1. 测试特定图片
```bash
curl "http://your-domain.com/api/test-image?url=https://prod-files-secure.s3.us-west-2.amazonaws.com/45e9d135-9939-47d9-9926-65d8fce8f56e/98801fc9-3f95-4ab0-ada2-e7d8e3d353b4/PB200N.png?X-Amz-Algorithm=..."
```

返回示例：
```json
{
  "success": true,
  "tests": {
    "original": {
      "status": 403,
      "working": false
    },
    "proxy": {
      "status": 200,
      "working": true,
      "cacheStatus": "MISS"
    }
  },
  "recommendation": "Original URL failed, but proxy is working - good!"
}
```

### 2. 检查图片代理直接访问
```
http://your-domain.com/api/image-proxy?url=https%3A%2F%2Fprod-files-secure.s3.us-west-2.amazonaws.com%2F...
```

应该直接返回图片内容。

### 3. 查看图片缓存状态
```bash
curl "http://your-domain.com/api/cache?action=images"
```

## 系统更改

### 1. NotionImage 组件
- **默认行为**: Notion 图片自动使用代理
- **绕过优化器**: 直接使用 `<img>` 标签而非 `<Image>`
- **智能重试**: 5种不同的获取策略

### 2. Next.js 配置
- **移除 Notion 域名**: 从 `remotePatterns` 中移除，强制使用代理
- **防止优化器处理**: Notion 图片不会进入 `_next/image` 处理流程

### 3. 图片代理增强
- **5种请求方式**: 不同 User-Agent 和 Header 组合
- **本地缓存**: 7天服务器端缓存
- **优雅降级**: 失败时显示占位图

## 预期效果

**之前**: 
- Notion 图片通过 `_next/image` 处理
- 遇到过期链接时返回 403 错误
- 用户看到图片加载失败

**现在**:
- Notion 图片直接通过代理获取
- 多种策略确保高成功率
- 失败时显示美观占位图
- 成功获取的图片被缓存7天

## 监控日志

部署后查看以下日志：
```
🌐 Fetching image from Notion: https://prod-files-secure.s3...
❌ Method 1 failed: 403
❌ Method 2 failed: 403  
✅ Successfully fetched image with method 3
📸 Cached image: image:abc123...
```

或者缓存命中：
```
📦 Serving image from cache: https://prod-files-secure.s3...
```

## 如果仍有问题

1. **检查代理API**: 直接访问 `/api/image-proxy?url=...`
2. **查看服务器日志**: 确认请求到达代理
3. **测试工具**: 使用 `/api/test-image` 进行诊断
4. **清空缓存**: 如果是缓存问题，使用 `/api/cache?action=clear-images`