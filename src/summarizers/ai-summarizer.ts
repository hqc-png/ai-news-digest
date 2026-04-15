import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import chalk from 'chalk';
import type { Article } from '../types.js';
import type { AIConfig } from '../config/ai-config.js';
import { fetchArticleContent } from '../fetchers/content-fetcher.js';

async function summarizeWithAnthropic(
  title: string,
  content: string,
  config: AIConfig
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
  });

  const message = await anthropic.messages.create({
    model: config.model || 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `请用中文总结以下AI新闻文章，要求简洁明了，2-3句话即可：

标题：${title}

内容：${content}

请直接输出摘要，不要包含"摘要："等前缀。`,
      },
    ],
  });

  const textContent = message.content.find((block) => block.type === 'text');
  return textContent && 'text' in textContent ? textContent.text : '无法生成摘要';
}

async function summarizeWithOpenAI(
  title: string,
  content: string,
  config: AIConfig
): Promise<string> {
  const openai = new OpenAI({ apiKey: config.apiKey });

  const completion = await openai.chat.completions.create({
    model: config.model || 'gpt-4o-mini',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: `请用中文总结以下AI新闻文章，要求简洁明了，2-3句话即可：

标题：${title}

内容：${content}

请直接输出摘要，不要包含"摘要："等前缀。`,
      },
    ],
  });

  return completion.choices[0]?.message?.content || '无法生成摘要';
}

export async function summarizeArticle(
  article: Article,
  config: AIConfig
): Promise<string> {
  try {
    let content = article.content;

    if (!content || content.length < 100) {
      console.log(chalk.gray(`  Fetching content for: ${article.title.substring(0, 50)}...`));
      content = await fetchArticleContent(article.link);
    }

    if (!content || content.length < 50) {
      console.log(chalk.yellow(`  ⚠ Insufficient content, using title only`));
      content = article.title;
    }

    console.log(chalk.blue(`  🤖 Summarizing: ${article.title.substring(0, 50)}...`));

    if (config.provider === 'anthropic') {
      return await summarizeWithAnthropic(article.title, content, config);
    } else {
      return await summarizeWithOpenAI(article.title, content, config);
    }
  } catch (error) {
    console.log(chalk.red(`  ✗ Failed to summarize: ${error}`));
    return '摘要生成失败';
  }
}

export async function summarizeArticles(
  articles: Article[],
  config: AIConfig
): Promise<Article[]> {
  console.log(chalk.bold.cyan(`\n🤖 Starting AI summarization (using ${config.provider.toUpperCase()})...\n`));

  const summarizedArticles: Article[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    console.log(chalk.white(`[${i + 1}/${articles.length}]`));

    const summary = await summarizeArticle(article, config);

    summarizedArticles.push({
      ...article,
      summary,
    });

    console.log(chalk.green(`  ✓ Summary generated\n`));

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(chalk.bold.green(`✓ All ${articles.length} articles summarized!\n`));

  return summarizedArticles;
}
