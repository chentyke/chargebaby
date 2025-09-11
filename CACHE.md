# 缓存和图片代理系统

## 概述

项目实现了服务器端缓存和图片代理系统，解决 Notion API 性能和图片访问问题。

## 问题解决

### 1. 缓存系统
- **问题**: Notion API 响应慢，可能触发限制
- **解决**: 60秒缓存 + 自动刷新
- **效果**: 响应时间从 500-2000ms 降低到 10-50ms

### 2. 图片代理
- **问题**: Notion 图片链接有时效性，会出现 403 错误
- **解决**: `/api/image-proxy` 代理服务
- **效果**: 图片访问稳定，24小时缓存

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
```

### 4. 手动操作
如果 Notion 数据更新了，可以手动刷新缓存：
```bash
curl "http://localhost:3000/api/cache?action=refresh"
```

## 故障排除

### 图片加载失败
1. 检查图片URL是否是Notion链接
2. 图片会自动降级到占位符

### 缓存不更新
1. 检查控制台日志
2. 手动刷新: `/api/cache?action=refresh`
3. 清空缓存: `/api/cache?action=clear`

### 服务器重启
- 内存缓存会清空，属正常现象
- 首次访问会重新建立缓存