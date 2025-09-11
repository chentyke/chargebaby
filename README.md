# ChargeBaby - 充电宝性能展示网站

一个基于 Next.js 和 Notion API 的充电宝性能展示和对比网站，部署在 Vercel 上。

## 🚀 技术栈

- **前端框架**: Next.js 14 (App Router)
- **样式框架**: Tailwind CSS
- **后端数据**: Notion API
- **类型支持**: TypeScript
- **部署平台**: Vercel
- **图标库**: Lucide React

## 📋 功能特性

### 已实现功能

- ✅ 响应式设计，支持移动端和桌面端
- ✅ 充电宝产品展示卡片
- ✅ 产品详情页面
- ✅ 基于 Notion API 的数据管理
- ✅ 产品筛选和搜索功能
- ✅ 性能评分和规格对比
- ✅ 优雅的加载状态和错误处理
- ✅ SEO 优化
- ✅ 图文内容支持（Markdown渲染）
- ✅ 新详情页布局（桌面端左侧固定，右侧可滚动）

### 计划功能

- 🔄 产品对比功能
- 🔄 用户评价系统
- 🔄 性能图表可视化
- 🔄 管理员后台
- 🔄 多语言支持

## 🛠️ 安装和运行

### 环境要求

- Node.js 18.0 或更高版本
- npm 或 yarn

### 1. 克隆项目

```bash
git clone <repository-url>
cd chargebaby
```

### 2. 安装依赖

```bash
npm install
# 或
yarn install
```

### 3. 配置环境变量

创建 `.env.local` 文件，并添加以下配置：

```env
# Notion API 配置
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here
NOTION_SUBMISSION_DATABASE_ID=your_submission_database_id_here
# API版本 - 使用稳定版本确保兼容性
# 如需尝试新功能，可升级到: 2025-09-03
NOTION_VERSION=2022-06-28

# Notion Webhook 配置（可选，推荐用于生产环境）
# 用于webhook签名验证，提高安全性
# 这应该是从Notion webhook验证时收到的verification_token
NOTION_WEBHOOK_SECRET=your_webhook_verification_token_here

# Next.js 配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. 启动开发服务器

```bash
npm run dev
# 或
yarn dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 🚀 Notion API 版本说明

项目当前使用稳定版本 `2022-06-28`，确保最佳的兼容性和稳定性。

### 📋 版本选择说明

**当前版本**: `2022-06-28` (稳定版本)  
**最新版本**: `2025-09-03` (包含多源数据库等新功能)

### ⚠️ 为什么使用稳定版本？

1. **兼容性保证**: 2022-06-28 版本经过充分测试，与现有数据库结构完全兼容
2. **稳定性优先**: 避免因新版本的重大架构变更导致的不稳定问题
3. **渐进升级**: 新版本的多源数据库功能需要额外的适配工作

### 🎯 新版本功能（计划支持）

- **多源数据库支持**：支持 Notion 最新的多源数据库架构
- **增强的 Webhook 功能**：更稳定的实时同步机制
- **更好的性能**：优化的 API 响应速度和稳定性
- **新功能支持**：可以使用 Notion 最新发布的所有功能

**代码兼容性**：✅ 已做好向后兼容处理
- 支持新旧版本的属性结构 (`title` 和 `rich_text`)
- 智能属性解析，自动适配不同版本的响应格式
- 无需修改现有数据库结构

### 🔧 如何升级到最新版本（可选）

如果您想尝试最新的 API 功能，可以升级到新版本：

1. **修改环境变量**：
   ```env
   NOTION_VERSION=2025-09-03
   ```

2. **注意事项**：
   - 新版本引入了多源数据库架构，可能需要额外的适配
   - 建议在测试环境中先进行验证
   - 如遇问题可随时回退到 `2022-06-28`

3. **重新部署应用**：
   ```bash
   npm run build
   npm start
   ```

4. **清除缓存**：
   ```bash
   curl "https://your-domain.com/api/cache?action=clear"
   ```

### 📝 升级测试检查清单

部署新版本后，建议进行以下测试：

- [ ] 数据列表页面正常加载
- [ ] 产品详情页面显示完整
- [ ] 搜索和筛选功能正常
- [ ] 投稿功能可以正常提交
- [ ] Webhook 事件正常接收（如已配置）
- [ ] 缓存刷新机制正常工作

如有任何问题，请及时回退到旧版本并联系技术支持。

## 📡 Webhook 实时同步配置（可选）

项目支持 Notion webhook 实时同步，当 Notion 数据库中的数据更新时，会自动清除相关缓存，确保网站内容实时更新。

### Webhook 功能说明

- **实时数据同步**：Notion 数据更新时立即清除缓存，无需等待60秒自动刷新
- **智能缓存失效**：根据更新的页面ID智能清除相关缓存
- **安全验证**：支持 HMAC-SHA256 签名验证，防止恶意请求
- **性能优化**：减少不必要的API调用，提升响应速度

### 配置 Notion Webhook

#### 1. 创建 Webhook 订阅

1. 访问 [Notion 集成设置页面](https://www.notion.so/my-integrations)
2. 选择您的集成或创建新的集成
3. 导航到 **Webhooks** 标签页
4. 点击 **+ Create a subscription**
5. 输入您的 Webhook URL：`https://your-domain.com/api/webhook`
   - 本地开发：需要使用 ngrok 等工具暴露本地端口
   - 生产环境：使用您的实际域名
6. 选择要订阅的事件类型：
   - `page.content_updated` - 页面内容更新
   - `data_source.schema_updated` - 数据库结构更新（新版本API）
   - `database.schema_updated` - 数据库结构更新（旧版本API）

#### 2. 验证 Webhook 订阅

1. 创建订阅后，Notion 会发送验证请求到您的端点
2. 检查服务器日志，找到包含 `verification_token` 的日志
3. 复制 `verification_token` 值（例如：`secret_YOUR_VERIFICATION_TOKEN_HERE`）
4. 回到 Notion 集成页面，点击 **⚠️ Verify**
5. 粘贴 `verification_token` 并点击 **Verify subscription**

#### 3. 配置环境变量

将收到的 `verification_token` 添加到环境变量中：

```env
NOTION_WEBHOOK_SECRET=secret_YOUR_VERIFICATION_TOKEN_HERE
```

#### 4. 测试 Webhook

1. **健康检查**：
   ```bash
   curl https://your-domain.com/api/webhook?action=health
   ```

2. **测试事件处理**（仅开发环境）：
   ```bash
   curl https://your-domain.com/api/webhook?action=test
   ```

3. **实际测试**：在 Notion 中修改充电宝页面标题，查看服务器日志是否收到 webhook 事件

### Webhook 监控和调试

#### 查看 Webhook 状态

- **健康检查**：`GET /api/webhook?action=health`
- **缓存状态**：`GET /api/cache?action=stats`

#### 日志示例

正常的 webhook 处理日志：
```
📡 Received webhook event: {
  type: 'page.content_updated',
  objectType: 'page',
  objectId: 'abc123...',
  timestamp: '2024-01-15T10:30:00.000Z'
}
🔄 Invalidating cache for page: abc123...
🗑️ Deleted cache key: charge-baby-abc123...
🗑️ Deleted cache key: charge-babies
✅ Page cache invalidated: abc123...
```

#### 故障排除

1. **未收到 webhook 事件**：
   - 检查 Webhook URL 是否正确且可访问
   - 确认订阅状态为 "active"
   - 检查 Notion 集成是否有访问数据库的权限

2. **签名验证失败**：
   - 确认 `NOTION_WEBHOOK_SECRET` 环境变量设置正确
   - 检查是否使用了正确的 `verification_token`

3. **缓存未更新**：
   - 查看服务器日志确认事件已处理
   - 检查缓存失效逻辑是否正确执行

### 本地开发 Webhook 测试

由于 Notion 需要访问公网 URL，本地开发时需要使用隧道工具：

#### 使用 ngrok
```bash
# 安装 ngrok
npm install -g ngrok

# 启动本地服务器
npm run dev

# 在另一个终端中启动 ngrok
ngrok http 3000

# 使用 ngrok 提供的 URL 配置 webhook
# 例如：https://abc123.ngrok.io/api/webhook
```

#### 使用 Vercel 预览部署
```bash
# 推送到 Git 分支
git push origin feature/webhook-test

# Vercel 会自动创建预览部署
# 使用预览 URL 配置 webhook
```

## 🗃️ Notion 数据库配置

### 创建 Notion 数据库

1. 在 Notion 中创建一个新的数据库
2. 添加以下属性（属性名称必须与代码中的一致）：

| 属性名称 | 类型 | 说明 |
|---------|------|------|
| Model | Title 或 Rich text | 型号 |
| Title | Rich text | 标题 |
| Subtitle | Rich text | 副标题 |
| Tags | Multi-select | 标签 |
| Price | Number | 定价 |
| ReleaseDate | Date | 发售时间 |
| OverallRating | Number | 综合评分 (1-100) |
| PerformanceRating | Number | 性能评分 (1-100) |
| SelfChargingCapability | Number | 自充能力 (1-40) |
| OutputCapability | Number | 输出能力 (1-35) |
| Energy | Number | 能量 (1-20) |
| ExperienceRating | Number | 体验评分 (1-100) |
| Portability | Number | 便携性 (1-40) |
| ChargingProtocols | Number | 充电协议 (1-30) |
| MultiPortUsage | Number | 多接口使用 (1-20) |
| Advantages | Rich text | 优势 |
| Disadvantages | Rich text | 不足 |
| Image | Files & media | 产品图片 |
| CreatedAt | Date | 创建时间 |
| UpdatedAt | Date | 更新时间 |

### 获取 Notion API 密钥

1. 访问 [Notion 开发者页面](https://www.notion.so/my-integrations)
2. 点击 "新建集成" 创建一个新的集成
3. 复制 "Internal Integration Token"
4. 在数据库页面点击 "共享"，邀请您的集成

### 获取数据库 ID

在 Notion 数据库页面的 URL 中找到数据库 ID：
```
https://www.notion.so/workspace/database_id?v=view_id
```

### 添加示例数据

您可以添加以下示例数据来测试网站功能：

#### 示例产品 1：小米充电宝
- **Model**: MI-20K
- **Title**: 小米充电宝20000mAh
- **Subtitle**: 大容量快充移动电源
- **Tags**: 快充,大容量
- **Price**: 149
- **ReleaseDate**: 2024-01-15
- **OverallRating**: 85
- **PerformanceRating**: 82
- **SelfChargingCapability**: 32 (满分40)
- **OutputCapability**: 28 (满分35)
- **Energy**: 18 (满分20)
- **ExperienceRating**: 80
- **Portability**: 30 (满分40)
- **ChargingProtocols**: 25 (满分30)
- **MultiPortUsage**: 16 (满分20)
- **Advantages**: 充电速度快,容量大,多接口支持
- **Disadvantages**: 体积较大,重量偏重

#### 示例产品 2：华为超级快充
- **Model**: HW-10K
- **Title**: 华为超级快充充电宝
- **Subtitle**: 40W双向快充
- **Tags**: 快充,无线充
- **Price**: 199
- **ReleaseDate**: 2024-02-20
- **OverallRating**: 91
- **PerformanceRating**: 93
- **SelfChargingCapability**: 35 (满分40)
- **OutputCapability**: 33 (满分35)
- **Energy**: 17 (满分20)
- **ExperienceRating**: 90
- **Portability**: 33 (满分40)
- **ChargingProtocols**: 28 (满分30)
- **MultiPortUsage**: 18 (满分20)
- **Advantages**: 超级快充,无线充电,质量可靠
- **Disadvantages**: 价格较高

### 数据填写说明

1. **评分字段**：不同字段有不同的满分
   - **综合评分/性能评分/体验评分**：1-100
   - **自充能力**：1-40
   - **输出能力**：1-35  
   - **能量**：1-20
   - **便携性**：1-40
   - **充电协议**：1-30
   - **多接口使用**：1-20

2. **标签字段**：在 Tags 中使用逗号分隔
3. **优势/不足**：在 Advantages 和 Disadvantages 中使用逗号分隔或换行分隔
4. **日期格式**：使用 YYYY-MM-DD 格式
5. **图片**：在 Image 字段中上传文件或使用外部链接

### 🎯 评分参考标准
- **自充能力 (1-40)**：充电宝自身充电速度
- **输出能力 (1-35)**：向设备输出的功率和效率
- **能量 (1-20)**：电池容量和能量密度
- **便携性 (1-40)**：体积、重量、携带便利性
- **充电协议 (1-30)**：支持的快充协议兼容性
- **多接口使用 (1-20)**：多设备同时充电的便利性

## 🚀 部署到 Vercel

### 1. 推送代码到 Git 仓库

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 导入您的 Git 仓库
4. 配置环境变量

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```
NOTION_API_KEY=your_notion_api_key_here
NOTION_DATABASE_ID=your_notion_database_id_here
NOTION_SUBMISSION_DATABASE_ID=your_submission_database_id_here
# API版本 - 使用稳定版本确保兼容性
# 如需尝试新功能，可升级到: 2025-09-03
NOTION_VERSION=2022-06-28
NOTION_WEBHOOK_SECRET=your_webhook_verification_token_here
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**注意**：部署完成后，您需要使用实际的域名（如 `https://your-project.vercel.app`）来配置 Notion webhook。

### 4. 部署

Vercel 会自动构建和部署您的应用。

## 📁 项目结构

```
chargebaby/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/                # API 路由
│   │   │   ├── cache/          # 缓存管理 API
│   │   │   ├── image-proxy/    # 图片代理 API
│   │   │   ├── submit/         # 投稿提交 API
│   │   │   └── webhook/        # Notion Webhook API
│   │   ├── charge-baby/[id]/   # 产品详情页
│   │   ├── globals.css         # 全局样式
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   ├── charge-baby-card.tsx
│   │   └── filter-section.tsx
│   ├── lib/                    # 工具函数和配置
│   │   ├── cache.ts            # 缓存系统
│   │   ├── notion.ts           # Notion API 集成
│   │   └── utils.ts            # 工具函数
│   └── types/                  # TypeScript 类型定义
│       └── chargebaby.ts
├── public/                     # 静态资源
├── .env.local                  # 环境变量（需要自行创建）
├── .env.example               # 环境变量示例
├── CACHE.md                   # 缓存系统说明
├── next.config.js             # Next.js 配置
├── tailwind.config.ts         # Tailwind CSS 配置
├── tsconfig.json              # TypeScript 配置
└── package.json               # 项目依赖
```

## 🎨 自定义和扩展

### 添加新的充电宝属性

1. 在 `src/types/chargebaby.ts` 中更新 `ChargeBaby` 接口
2. 在 `src/lib/notion.ts` 中更新解析逻辑
3. 在 Notion 数据库中添加对应的属性
4. 更新相关的组件显示逻辑

### 自定义样式

项目使用 Tailwind CSS，您可以：

1. 修改 `tailwind.config.ts` 中的主题配置
2. 在 `src/app/globals.css` 中添加自定义样式
3. 使用 Tailwind 的工具类进行快速样式调整

### 添加新功能

参考现有组件的结构，创建新的组件和页面：

1. 在 `src/components/` 中创建新组件
2. 在 `src/app/` 中添加新页面
3. 更新类型定义和 API 调用逻辑

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 打开 Pull Request

## 📝 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📞 联系我们

- 项目主页: [GitHub Repository](https://github.com/your-username/chargebaby)
- 问题反馈: [GitHub Issues](https://github.com/your-username/chargebaby/issues)
- 邮箱: contact@chargebaby.com

## 🙏 致谢

感谢以下开源项目和服务：

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Notion API](https://developers.notion.com/) - 数据存储
- [Vercel](https://vercel.com/) - 部署平台
- [Lucide](https://lucide.dev/) - 图标库
