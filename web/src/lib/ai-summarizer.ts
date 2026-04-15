/**
 * AI Summarizer Module
 * 使用 AI（Claude/GPT）生成文章摘要，集成降级策略
 */

import type { Article, AIConfig } from './types';
import { summarizeWithFallback } from './fallback-summarizer';

/**
 * 使用 Anthropic Claude 生成摘要
 */
async function summarizeWithAnthropic(article: Article, config: AIConfig): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default;

  const client = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const content = article.content || article.title;

  const message = await client.messages.create({
    model: config.model || 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `请用中文为以下文章生成一个简洁的摘要（2-3句话）：

标题：${article.title}
内容：${content.substring(0, 2000)}

要求：
- 用中文回答
- 2-3句话
- 突出要点
- 不要包含"这篇文章"等开头`
      }
    ]
  });

  const text = message.content[0];
  if (text.type === 'text') {
    return text.text.trim();
  }

  throw new Error('No text response from Anthropic');
}

/**
 * 使用 OpenAI GPT 生成摘要
 */
async function summarizeWithOpenAI(article: Article, config: AIConfig): Promise<string> {
  const OpenAI = (await import('openai')).default;

  const client = new OpenAI({
    apiKey: config.apiKey,
  });

  const content = article.content || article.title;

  const completion = await client.chat.completions.create({
    model: config.model || 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `请用中文为以下文章生成一个简洁的摘要（2-3句话）：

标题：${article.title}
内容：${content.substring(0, 2000)}

要求：
- 用中文回答
- 2-3句话
- 突出要点
- 不要包含"这篇文章"等开头`
      }
    ]
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) {
    throw new Error('No text response from OpenAI');
  }

  return text.trim();
}

/**
 * 为单篇文章生成 AI 摘要
 */
async function summarizeArticle(article: Article, config: AIConfig): Promise<string> {
  if (config.provider === 'anthropic') {
    return await summarizeWithAnthropic(article, config);
  } else {
    return await summarizeWithOpenAI(article, config);
  }
}

/**
 * 批量生成文章摘要（带自动降级）
 *
 * @param articles - 文章数组
 * @param config - AI 配置（可选）
 * @returns 带摘要的文章数组
 */
export async function summarizeArticles(
  articles: Article[],
  config?: AIConfig | null
): Promise<Article[]> {
  console.log(`\n🤖 Starting summarization for ${articles.length} articles...`);

  if (!config) {
    console.log('⚠️  No AI config provided, using fallback summarization only.');
    return summarizeWithFallback(articles);
  }

  console.log(`✅ Using ${config.provider.toUpperCase()} (${config.model})`);

  // 创建 AI 摘要函数
  const aiSummarizer = async (article: Article) => {
    return await summarizeArticle(article, config);
  };

  // 使用带降级的摘要函数
  return await summarizeWithFallback(articles, aiSummarizer);
}
