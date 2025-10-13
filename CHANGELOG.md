# ChargeBaby Showcase 版本更新日志

## v1.0.1 (2025-10-13) - 文档解析修复版本

### 🐛 重要修复
- **修复Notion文档解析截断问题** - 添加分页支持，确保长文档完整显示
- 重构getPageBlocks函数，支持获取所有页面块而不仅是第一页
- 修复fetchDocsFromNotion函数的数据库查询分页问题
- 增加详细日志输出便于调试文档解析问题

### 🚀 技术改进
- 优化Notion API调用效率，增加页面大小到100
- 添加文档块获取数量统计
- 改进错误处理和重试机制

---

## v1.0.0 (2025-10-09) - 最新稳定版

### 🚀 主要功能
- 完整的充电宝产品对比系统
- 移动端响应式设计
- 详细的规格参数展示
- 用户评测提交系统
- 搜索和筛选功能
- 图片缓存优化

### 🐛 最近修复
- 修复页面文本选择和复制功能
- 重构主题系统，明确主题解析类型定义
- 引入主题守卫组件并优化主题切换逻辑
- 调整文档目录样式以改善滚动体验
- 通用Bug修复
- 新增公告功能

## v0.9.0 (2025-10-03) - 移动端优化版本

### ✨ 新功能
- 增强对比界面的移动端响应性，改善布局一致性
- 为对比界面增加新的数据卡片和产品规格详细描述
- 为对比页面增加搜索功能

### 🎨 UI优化
- 重构 ItemBar 和 ItemBarInline 组件，改善布局和视觉一致性
- 重构评分组件，支持处理超出最大限制的数值
- UI界面增强
- 移动端布局修复

### 🐛 Bug修复
- 通用Bug修复
- 修复多个功能Bug
- 线缆Beta功能Bug修复

## v0.8.0 (2025-09-28) - 功能增强版本

### ✨ 新功能
- 添加京东数据源支持
- 新增列表视图，UI优化
- 修复 parseDetailData 函数中的 energy20min 属性解析

### 🎨 UI优化
- UI界面增强
- UI优化
- UI修复

### 🐛 Bug修复
- 完善数据处理
- 屏蔽重复标签
- 京东数据调整
- 修复多个功能Bug

## v0.7.0 (2025-09-20) - CDN优化版本

### 🚀 性能优化
- 使用 Cloudflare Turnstile 替换 CAP 服务
- 优化CDN缓存
- 修复图片缓存CDN优化 - 紧急修复所有图片显示相同的bug
- 添加图片缓存优化测试脚本，增强图片代理API缓存一致性

### ✨ 新功能
- 添加充电宝文档功能
- 重构 ChargeBabyDetailPage 并添加 DetailDataPreviewCard 组件
- 为 ChargeBabyDetailPage 添加 generateMetadata 函数，实现动态SEO元数据生成
- 添加分享按钮和购买链接组件

### 🐛 Bug修复
- 修复样式问题
- 更新 DetailDataPreviewCard 组件样式和文本清晰度
- 增强 SubmitPage 和 TurnstileWidget 组件的客户端渲染
- 修复多个功能Bug

## v0.6.0 (2025-09-15) - 评测系统版本

### ✨ 新功能
- 添加反馈功能
- 为 SubmitPage 添加用户问题报告的反馈选项
- 实现评测提交功能，包含新的API端点和管理模态框
- 添加图片上传功能和 Notion 集成
- 增强提交数据处理，添加多选支持和改进数据提取逻辑

### 🎨 UI优化
- 重构ICP备案信息处理，引入 ICPBeian 组件
- 使用 ConditionalFooter 替换 Footer，根据页面类型管理页脚可见性
- 更新页脚样式，改善视觉一致性
- 重构ESLint配置，增强评测提交数据结构

### 🐛 Bug修复
- 增强评测提交流程，改进Turnstile验证和图片上传处理
- 重构 Turnstile 验证组件在 SubmissionTab 中的位置
- 实现设备特定性能优化，引入 DeviceOptimizedContainer 组件
- 增强Chrome和Android设备的性能优化

## v0.5.0 (2025-09-10) - 微信功能版本

### ✨ 新功能
- 添加 WeChatPage 组件并更新 ChargeBabyCard 的微信群组导航
- 重构 getChargeBabies 函数，优先显示微信组件

### 🎨 UI优化
- 增强 FilterComponent，引入容量和功率预设及滑块功能
- 为 ChargeBabyCard 和 FilterComponent 添加重量和价格排序选项
- 为 FilterComponent 和 SearchCompareToolbar 添加价格过滤功能
- 增强移动端触摸交互，改进按钮样式和触摸目标大小

### 🐛 Bug修复
- 从 CompareInterface 的可用产品中过滤掉'WeChat'型号
- 重构 ChargeBabyCard 和 FilterComponent，改善数据处理
- 增强 SubmissionTab 组件，更新表单输入样式
- 在 SearchCompareToolbar 中实现搜索建议功能
- 增强 FilterComponent 和 SearchCompareToolbar，添加内联过滤选项

## v0.4.0 (2025-09-05) - 基础功能版本

### ✨ 新功能
- 添加联系管理员弹窗功能，更新评测标题和说明
- 添加相关评测功能
- 添加Notion数据获取脚本和子项目评测卡片组件
- 线缆长度支持多项输入
- 添加示例图片
- 增加表单功能

### 🎨 UI优化
- UI优化
- 优化UI和数据库结构
- 优化提交流程
- 优化表单UI样式
- 重构提交页面和工具栏，改善用户体验

### 🐛 Bug修复
- 修复数据库结构问题
- 添加ICP页脚
- 适配Turnstile验证
- 适配移动端
- 修复多个功能Bug

## v0.3.0 (2025-08-28) - 图片功能版本

### ✨ 新功能
- 添加图片缩放功能，增强组件中的图片处理
- 增强图片缩放功能，支持动态缩放和触摸支持
- 添加图片下载功能

### 🎨 UI优化
- 更新 layout.tsx 中的字体配置，包含显示和预加载选项
- 优化移动端交互体验
- 优化UI布局

### 🐛 Bug修复
- 重构 ImageZoom 和 NotionImage 组件中的图片处理
- 修复放大逻辑
- 重构 ChargeBabyCard 和 ComparisonTable 组件中的评分检查
- 更新 DetailDataPage 和数据描述中的术语
- 修复能量体积比解析
- 重构 DetailDataPage 和 ComparisonTable 组件中的能量重量比显示
- 为 ComparisonTable 组件添加数据源信息
- 重构各组件中的数字格式化以保持一致性

## v0.2.0 (2025-08-20) - 搜索筛选版本

### ✨ 新功能
- 添加产品对比功能
- 添加详细数据页面功能
- 添加排序功能，更新筛选组件，优化产品展示逻辑
- 添加筛选功能
- 支持自定义图文内容

### 🎨 UI优化
- 优化排行榜组件和搜索工具栏，增加移动端适配
- 更新配置文件，添加排行榜按钮，优化搜索工具栏和比较界面
- UI优化
- 优化UI设计
- 适配移动端

### 🐛 Bug修复
- 实现产品详情和404页面，增强排行榜和产品网格的错误处理
- 重构 ProductsGrid 中的错误处理，使用 Next.js Link 组件导航
- 更新 package.json 并重构 filter-component 和 notion 库
- 修复移动端UI问题
- 添加数据来源
- 修复多个功能Bug

## v0.1.0 (2025-08-15) - 项目初始版本

### ✨ 初始功能
- 项目初始化
- 更新 package.json
- 移动端适配
- 添加显示名称功能

### 🎨 基础UI
- 基础产品展示页面
- 简单的产品列表
- 基础样式框架

### 🐛 初始修复
- 修复初始Bug
- 修复移动端UI问题

---

*最后更新: 2025-10-13*
*当前版本: 1.0.0*