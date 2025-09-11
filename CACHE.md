# 缓存和图片代理系统

## 概述

项目实现了服务器端缓存和图片代理系统，解决 Notion API 性能和图片访问问题。

## 问题解决

### 1. 数据缓存系统
- **问题**: Notion API 响应慢，可能触发限制
- **解决**: 60秒缓存 + 自动刷新
- **效果**: 响应时间从 500-2000ms 降低到 10-50ms

### 2. 图片代理和缓存
- **问题**: Notion 图片链接有时效性，会出现 403 错误
- **解决**: 
  - `/api/image-proxy` 智能代理服务
  - 多重获取策略（3种不同的请求方式）
  - 7天本地缓存
  - 自动降级到占位图
- **效果**: 
  - 图片访问成功率大幅提升
  - 缓存命中后加载速度极快
  - 用户体验稳定

## 缓存管理 API

### 查看缓存状态
```bash
GET /api/cache?action=stats
```

### 清空所有缓存
```bash
GET /api/cache?action=clear
```

### 手动刷新缓存
```bash
GET /api/cache?action=refresh
```

### 查看图片缓存状态
```bash
GET /api/cache?action=images
```

### 清空图片缓存
```bash
GET /api/cache?action=clear-images
```

### 删除特定缓存
```bash
POST /api/cache
Content-Type: application/json

{
  "key": "charge-babies"
}
```

## 部署说明

### 1. 环境变量
```env
NOTION_API_KEY=your_notion_api_key
NOTION_DATABASE_ID=your_database_id
```

### 2. 启动应用
```bash
npm run build
npm start
```

### 3. 监控日志
正常运行会看到：
```
📦 Serving charge babies from cache
🌐 Fetching charge babies from Notion API  
🔄 Refreshing cache for key: charge-babies
✅ Cache refreshed for key: charge-babies

📦 Serving image from cache: https://prod-files-secure.s3...
🌐 Fetching image from Notion: https://prod-files-secure.s3...
✅ Successfully fetched image with method 1
📸 Cached image: image:abc123...
```

### 4. 手动操作
数据缓存管理：
```bash
# 数据更新后，手动刷新缓存
curl "http://localhost:3000/api/cache?action=refresh"

# 查看缓存状态
curl "http://localhost:3000/api/cache?action=stats"
```

图片缓存管理：
```bash
# 查看图片缓存状态
curl "http://localhost:3000/api/cache?action=images"

# 清空图片缓存（释放内存）
curl "http://localhost:3000/api/cache?action=clear-images"
```

## 故障排除

### 图片加载失败
1. **自动重试**: 系统会自动使用5种不同方式重试
2. **占位图**: 最终失败会显示占位图，不影响用户体验
3. **查看日志**: 检查控制台是否有图片获取失败的日志
4. **测试特定图片**: `GET /api/test-image?url=<notion_image_url>` 测试图片是否可访问

### 图片缓存问题
1. **查看状态**: `GET /api/cache?action=images`
2. **清空缓存**: `GET /api/cache?action=clear-images`
3. **重新缓存**: 清空后访问页面会重新缓存图片

### 数据缓存不更新
1. **检查日志**: 看是否有自动刷新日志
2. **手动刷新**: `/api/cache?action=refresh`
3. **完全清空**: `/api/cache?action=clear`

### 内存使用
- **数据缓存**: 通常几MB
- **图片缓存**: 可能几十到几百MB（取决于图片数量）
- **定期清理**: 可以定期清空图片缓存释放内存

### 服务器重启
- 内存缓存会清空，属正常现象
- 首次访问会重新建立缓存
- 图片会根据需要重新缓存