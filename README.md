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
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

### 4. 部署

Vercel 会自动构建和部署您的应用。

## 📁 项目结构

```
chargebaby/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── charge-baby/[id]/   # 产品详情页
│   │   ├── globals.css         # 全局样式
│   │   ├── layout.tsx          # 根布局
│   │   └── page.tsx            # 首页
│   ├── components/             # React 组件
│   │   ├── ui/                 # 基础 UI 组件
│   │   ├── charge-baby-card.tsx
│   │   └── filter-section.tsx
│   ├── lib/                    # 工具函数和配置
│   │   ├── notion.ts           # Notion API 集成
│   │   └── utils.ts            # 工具函数
│   └── types/                  # TypeScript 类型定义
│       └── chargebaby.ts
├── public/                     # 静态资源
├── .env.local                  # 环境变量（需要自行创建）
├── .env.example               # 环境变量示例
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
