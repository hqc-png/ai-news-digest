# AI News Digest

🤖 一个 AI 新闻聚合平台，自动抓取多个 RSS 源的 AI 相关新闻，使用 AI 生成中文摘要，并提供 Web 界面展示和 Markdown 报告。

## ✨ 主要功能

### 核心特性
- 📡 **多源抓取**：从 TechCrunch、The Verge、Hacker News 等抓取 AI 新闻
- ⏰ **智能过滤**：自动过滤最近 24 小时的文章
- 🤖 **AI 摘要**：使用 Anthropic Claude 或 OpenAI GPT 生成中文摘要
- 🔄 **降级策略**：AI 失败时自动生成简略摘要（基于内容提取）
- 🌐 **Web 展示**：使用 Astro + Cloudflare Pages 构建的现代化 Web 界面
- 🔍 **全文搜索**：基于 SQLite FTS5 的高性能搜索
- ⏱️ **定时任务**：Cloudflare Cron Triggers 每日自动更新
- 📋 **Markdown 报告**：CLI 工具生成离线报告

### 技术栈
- **前端**：Astro 5.x (SSR) + Tailwind CSS
- **后端**：Cloudflare Workers + Pages Functions
- **数据库**：Cloudflare D1 (SQLite)
- **定时任务**：Cloudflare Cron Triggers + GitHub Actions 备份
- **AI**：Anthropic Claude / OpenAI GPT
- **部署**：Cloudflare Pages (免费)

## 🚀 快速开始

### 1. CLI 工具（本地运行）

```bash
# 安装依赖
npm install

# 配置 AI API（可选）
cp .env.example .env
# 编辑 .env 添加 API 密钥

# 运行 CLI 工具
npm start
```

生成的 Markdown 报告将保存在 `output/` 目录。

### 2. Web 应用（本地开发）

```bash
# 进入 web 目录
cd web

# 安装依赖
npm install

# 初始化本地 D1 数据库
wrangler d1 execute ai-digest --local --file schema.sql

# 启动开发服务器
npm run dev
```

访问 http://localhost:4321 查看 Web 界面。

### 3. 手动触发抓取任务

```bash
# 访问以下 URL 手动触发抓取
http://localhost:4321/api/trigger-cron
```

## 📦 项目结构

```
ai-news-digest/
├── src/                               # CLI 工具源码
│   ├── index.ts                       # CLI 入口
│   ├── types.ts                       # TypeScript 类型定义
│   ├── config/
│   │   └── ai-config.ts              # AI API 配置
│   ├── fetchers/
│   │   ├── rss-fetcher.ts            # RSS 抓取（支持重试）
│   │   ├── sources.ts                # RSS 源配置
│   │   └── content-fetcher.ts        # 正文提取
│   ├── parsers/
│   │   └── feed-parser.ts            # Feed 解析
│   ├── filters/
│   │   └── time-filter.ts            # 时间过滤
│   ├── summarizers/
│   │   └── ai-summarizer.ts          # AI 摘要生成
│   └── generators/
│       └── markdown-generator.ts      # Markdown 报告生成
│
├── web/                               # Web 应用
│   ├── src/
│   │   ├── lib/                       # 共享库（复用 CLI 逻辑）
│   │   │   ├── rss-fetcher.ts        # RSS 抓取
│   │   │   ├── ai-summarizer.ts      # AI 摘要
│   │   │   ├── fallback-summarizer.ts # 降级摘要
│   │   │   ├── db.ts                 # D1 数据库工具
│   │   │   └── sources.ts            # RSS 源配置
│   │   │
│   │   ├── pages/
│   │   │   ├── index.astro           # 首页（文章列表）
│   │   │   └── api/
│   │   │       ├── articles.ts       # 文章列表 API
│   │   │       ├── search.ts         # 搜索 API
│   │   │       ├── count.ts          # 文章数量 API
│   │   │       └── trigger-cron.ts   # 手动触发任务
│   │   │
│   │   ├── components/
│   │   │   ├── ArticleCard.astro     # 文章卡片
│   │   │   └── SearchBar.astro       # 搜索栏
│   │   │
│   │   └── layouts/
│   │       └── Layout.astro          # 主布局
│   │
│   ├── functions/
│   │   └── scheduled.ts              # Cron 任务入口
│   │
│   ├── schema.sql                    # D1 数据库表结构
│   ├── wrangler.toml                 # Cloudflare 配置
│   ├── astro.config.mjs              # Astro 配置
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── backup-digest.yml         # GitHub Actions 备份任务
│
├── output/                           # CLI 生成的 Markdown 报告
├── .env.example                      # 环境变量模板
├── README.md
└── CLAUDE.md
```

## ⚙️ 配置说明

### 环境变量

创建 `.env` 文件：

```bash
# Anthropic Claude API（推荐）
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_MODEL=claude-3-5-haiku-20241022

# OpenAI GPT API（备选）
# OPENAI_API_KEY=your_openai_api_key
# OPENAI_MODEL=gpt-4o-mini
```

**注意**：如果不配置 API 密钥，系统会自动使用降级策略生成简略摘要。

### Cloudflare 配置

编辑 `web/wrangler.toml`：

```toml
name = "ai-news-digest"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "ai-digest"
database_id = "your-database-id"  # 从 Cloudflare 获取

[triggers]
crons = ["0 9 * * *"]  # 每天 9:00 AM UTC
```

## 🌐 部署到 Cloudflare Pages

### 前提条件
1. 拥有 Cloudflare 账号（免费）
2. 安装 Wrangler CLI：`npm install -g wrangler`
3. 登录：`wrangler login`

### 部署步骤

**1. 创建 D1 数据库（生产环境）**

```bash
cd web
wrangler d1 create ai-digest
# 复制返回的 database_id 到 wrangler.toml
```

**2. 初始化数据库表结构**

```bash
wrangler d1 execute ai-digest --remote --file schema.sql
```

**3. 推送代码到 GitHub**

```bash
git push origin main
```

**4. 在 Cloudflare Dashboard 配置**

1. 访问 Cloudflare Dashboard > Pages
2. 点击"Create a project" > "Connect to Git"
3. 选择你的 GitHub 仓库
4. 配置构建设置：
   - **Build command**: `cd web && npm run build`
   - **Build output directory**: `web/dist`
   - **Root directory**: `/`

5. 添加环境变量（可选）：
   - `ANTHROPIC_API_KEY`（用于 AI 摘要）
   - `OPENAI_API_KEY`（备选）

6. 绑定 D1 数据库：
   - 在 Settings > Functions > D1 database bindings
   - 变量名：`DB`
   - D1 数据库：选择刚创建的 `ai-digest`

7. 点击"Save and Deploy"

**5. 验证部署**

访问 Cloudflare 提供的 URL（如 `https://ai-news-digest.pages.dev`），确认：
- 首页显示文章列表
- 搜索功能正常
- 统计数据正确

**6. 配置 Cron Triggers**

Cloudflare Pages 会自动读取 `wrangler.toml` 中的 `[triggers]` 配置，定时任务会在部署后自动生效。

## 🔍 API 文档

### GET /api/articles
获取文章列表（分页）

**参数**：
- `page`：页码（默认 1）
- `limit`：每页数量（默认 20，最大 100）

**响应**：
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "count": 20
  }
}
```

### GET /api/search
全文搜索文章

**参数**：
- `q`：搜索关键词（必填）

**响应**：
```json
{
  "success": true,
  "query": "AI",
  "count": 15,
  "data": [...]
}
```

### GET /api/count
获取文章总数

**响应**：
```json
{
  "success": true,
  "count": 42
}
```

### GET /api/trigger-cron
手动触发抓取任务（用于测试）

**响应**：
```json
{
  "success": true,
  "summary": {
    "totalFetched": 60,
    "recentArticles": 40,
    "savedToDb": 38,
    "deletedOld": 5,
    "aiProvider": "anthropic",
    "duration": "6.32s"
  }
}
```

## 🛠️ 开发指南

### 本地开发

```bash
# CLI 工具开发
npm run dev  # watch 模式

# Web 应用开发
cd web
npm run dev
```

### 添加新的 RSS 源

编辑 `src/fetchers/sources.ts` 和 `web/src/lib/sources.ts`：

```typescript
export const RSS_SOURCES: RSSSource[] = [
  {
    name: 'Your Source Name',
    url: 'https://example.com/rss/feed.xml',
  },
  // ... 更多源
];
```

### 测试 D1 数据库

```bash
# 本地数据库
wrangler d1 execute ai-digest --local --command "SELECT * FROM articles LIMIT 5"

# 生产数据库
wrangler d1 execute ai-digest --remote --command "SELECT COUNT(*) FROM articles"
```

### 手动清理旧数据

```bash
# 清理 7 天前的数据
wrangler d1 execute ai-digest --remote --command \
  "DELETE FROM articles WHERE date < datetime('now', '-7 days')"
```

## 📊 功能特性详解

### AI 降级策略

系统采用三级降级策略确保稳定运行：

1. **优先使用 AI 摘要**：
   - 使用 Anthropic Claude API 生成高质量中文摘要
   - 失败时自动尝试 OpenAI GPT API

2. **自动降级到简略摘要**：
   - 从文章内容提取前 200 字符
   - 去除 HTML 标签和多余空格

3. **最后降级到标题摘要**：
   - 当内容不足时，使用文章标题生成摘要

### 数据保留策略

- 只保留最近 **7 天**的文章数据
- Cron 任务执行时自动清理旧数据
- 保持数据库体积小（< 10MB），查询速度快

### 搜索功能

- **客户端搜索**（小数据集 < 500 条）：
  - 使用 JavaScript 简单匹配
  - 无需服务器请求，响应快

- **服务端搜索**（大数据集 >= 500 条）：
  - 使用 SQLite FTS5 全文索引
  - 支持中文分词，搜索精准

### 定时任务备份

- **主任务**：Cloudflare Cron Triggers（每天 9:00 AM）
- **备份任务**：GitHub Actions（每天 9:30 AM）
- 备份任务会检测主任务是否执行，失败时自动补偿

## 🆓 成本说明

完全使用 Cloudflare 免费额度，无需付费：

| 服务 | 免费额度 | 预估用量 | 状态 |
|------|---------|---------|------|
| Pages 请求 | 无限 | ~1000/天 | ✅ 充足 |
| Workers 请求 | 100K/天 | ~500/天 | ✅ 充足 |
| Cron 执行 | 100K/月 | 30/月 | ✅ 充足 |
| D1 存储 | 5GB | ~100MB | ✅ 充足 |
| D1 读取 | 5M/天 | ~5K/天 | ✅ 充足 |

**总成本：$0**

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT

## 🔗 相关链接

- [Astro 文档](https://astro.build)
- [Cloudflare Pages 文档](https://developers.cloudflare.com/pages)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1)
- [Anthropic API 文档](https://docs.anthropic.com)
- [OpenAI API 文档](https://platform.openai.com/docs)
