# AI News Digest - Claude Code 指南

## 项目概述
这是一个 TypeScript CLI 工具,用于聚合 AI 新闻并生成带 AI 摘要的 Markdown 日报。

## 架构说明

### 核心模块
1. **RSS 抓取** (`src/fetchers/`)
   - `rss-fetcher.ts`: 并发抓取多个 RSS 源,带重试机制
   - `sources.ts`: RSS 源配置(TechCrunch、The Verge、Hacker News)
   - `content-fetcher.ts`: 从文章 URL 抓取正文内容

2. **数据处理** (`src/parsers/`, `src/filters/`)
   - `feed-parser.ts`: 解析 RSS XML 并标准化数据
   - `time-filter.ts`: 过滤 24 小时内的文章,按时间排序

3. **AI 摘要** (`src/summarizers/`)
   - `ai-summarizer.ts`: 使用 Claude/GPT 生成中文摘要
   - 支持 Anthropic 和 OpenAI 两种提供商

4. **报告生成** (`src/generators/`)
   - `markdown-generator.ts`: 生成 Markdown 格式日报

5. **配置** (`src/config/`)
   - `ai-config.ts`: AI API 配置管理

### 数据流
RSS 源 → 抓取 → 解析 → 过滤 → AI 摘要 → Markdown 报告

## 开发约定

### 代码风格
- TypeScript strict 模式
- ESM 模块(使用 .js 扩展名导入)
- 异步操作使用 async/await
- 错误处理: try-catch + 降级策略

### 关键约束
1. **AI 摘要必须用中文**: `ai-summarizer.ts` 中的提示词固定为中文
2. **RSS 源不要随意修改**: `sources.ts` 中的源已验证可用
3. **24 小时过滤逻辑**: 不要修改时间窗口,保持一致性
4. **API 调用限流**: 每篇文章间隔 500ms,避免触发限流
5. **环境变量优先级**: ANTHROPIC_API_KEY > OPENAI_API_KEY

### 文件命名规范
- 模块文件: kebab-case(如 `rss-fetcher.ts`)
- 类型定义: 统一在 `types.ts`
- 配置文件: 以 `-config.ts` 结尾

## 常见任务

### 添加新的 RSS 源
1. 在 `src/fetchers/sources.ts` 中添加源配置
2. 测试 RSS 源是否可访问
3. 验证解析结果

### 修改 AI 摘要提示词
位置: `src/summarizers/ai-summarizer.ts`
函数: `summarizeWithAnthropic` 和 `summarizeWithOpenAI`

### 调整时间过滤
位置: `src/filters/time-filter.ts`
函数: `filterLast24Hours`(使用 date-fns 的 `subHours`)

### 修改报告格式
位置: `src/generators/markdown-generator.ts`
函数: `generateMarkdown`

## 测试和验证

### 运行工具
```bash
npm start
```

### 验证清单
1. RSS 源抓取成功(3/3)
2. 过滤出 24 小时内文章
3. AI 摘要生成(中文,2-3 句话)
4. Markdown 文件生成在 `output/` 目录
5. 文件大小合理(约 10KB)

## 依赖说明

### 核心依赖
- `rss-parser`: RSS/Atom feed 解析
- `@anthropic-ai/sdk`: Claude API 客户端
- `openai`: OpenAI GPT API 客户端
- `axios`: HTTP 请求(抓取网页)
- `cheerio`: HTML 解析(提取正文)
- `date-fns`: 日期处理
- `chalk`: 终端彩色输出
- `dotenv`: 环境变量加载

### 运行时
- `tsx`: 直接运行 TypeScript
- Node.js >= 20.9.0

## 重要提示

- **不要跳过 AI 摘要**: 即使 API 调用较慢,也要保持这个功能
- **错误优雅降级**: 单个源失败不影响其他源
- **保持中文输出**: 所有摘要必须是中文
- **API 密钥安全**: 确保 .env 文件在 .gitignore 中

## 项目目录结构

```
ai-news-digest/
├── src/
│   ├── config/
│   │   └── ai-config.ts         # AI API 配置管理
│   ├── fetchers/
│   │   ├── rss-fetcher.ts       # RSS 抓取器
│   │   ├── sources.ts           # RSS 源配置
│   │   └── content-fetcher.ts   # 网页正文抓取
│   ├── parsers/
│   │   └── feed-parser.ts       # Feed 解析器
│   ├── filters/
│   │   └── time-filter.ts       # 时间过滤器
│   ├── summarizers/
│   │   └── ai-summarizer.ts     # AI 摘要生成
│   ├── generators/
│   │   └── markdown-generator.ts # Markdown 生成器
│   ├── types.ts                 # TypeScript 类型定义
│   └── index.ts                 # 入口文件
├── output/                      # 生成的报告输出目录
├── .env                         # 环境变量(不提交到 Git)
├── .env.example                 # 环境变量模板
├── package.json
├── tsconfig.json
├── README.md                    # 用户文档
└── CLAUDE.md                    # AI 助手指南(本文件)
```

## 开发工作流

1. **准备环境**
   - 复制 `.env.example` 到 `.env`
   - 填入 API 密钥(至少一个)
   - 运行 `npm install`

2. **开发新功能**
   - 遵循现有模块结构
   - 保持单一职责原则
   - 添加适当的错误处理

3. **测试**
   - 运行 `npm start` 验证端到端流程
   - 检查 `output/` 目录中生成的文件
   - 确认摘要质量

4. **调试**
   - 使用 `console.log` 输出调试信息
   - 检查 API 调用是否成功
   - 验证数据在各阶段的转换

## API 使用注意事项

### Anthropic Claude API
- 模型: claude-3-5-sonnet-20241022
- 上下文窗口: 200K tokens
- 速率限制: 注意官方限制
- 成本: 按 token 计费

### OpenAI API
- 模型: gpt-4o-mini
- 成本优化: 使用 mini 版本
- 降级策略: Claude 失败时使用

## 故障排查

### 常见问题

1. **RSS 抓取失败**
   - 检查网络连接
   - 验证 RSS 源 URL 是否有效
   - 查看是否被源站限流

2. **AI 摘要失败**
   - 确认 API 密钥正确
   - 检查 API 配额和限流
   - 查看错误日志详细信息

3. **文章内容为空**
   - 某些网站可能阻止爬虫
   - 使用 RSS feed 中的描述作为备选
   - 考虑添加 User-Agent 头

4. **时间过滤不准确**
   - 确认系统时区设置
   - 验证 RSS feed 中的时间格式
   - 检查 date-fns 的时间计算

## 未来改进方向

- 添加更多 AI 新闻源
- 支持其他语言的摘要
- 添加邮件发送功能
- Web UI 界面
- 数据库存储历史文章
- 添加单元测试和集成测试
