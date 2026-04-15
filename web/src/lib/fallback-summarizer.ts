/**
 * Fallback Summarizer - AI 降级摘要生成器
 * 当 AI API 不可用或失败时，使用文本提取生成简略摘要
 */

import type { Article } from './types';

/**
 * 生成简略摘要（无 AI）
 *
 * 降级策略：
 * 1. 优先提取文章内容前 200 字符
 * 2. 去除 HTML 标签和多余空格
 * 3. 若内容不足 50 字，使用标题
 *
 * @param article - 文章对象
 * @returns 简略摘要文本
 */
export function generateFallbackSummary(article: Article): string {
  // 尝试从内容提取
  if (article.content && article.content.length > 50) {
    const cleaned = article.content
      .replace(/<[^>]*>/g, '')      // 去除 HTML 标签
      .replace(/\s+/g, ' ')         // 合并多个空格为一个
      .replace(/\n+/g, ' ')         // 去除换行
      .trim();

    if (cleaned.length > 200) {
      // 截取前 200 字符，并在句子结束处截断
      const truncated = cleaned.substring(0, 200);
      const lastPeriod = truncated.lastIndexOf('。');
      const lastDot = truncated.lastIndexOf('.');

      const cutPoint = Math.max(lastPeriod, lastDot);
      if (cutPoint > 50) {
        return truncated.substring(0, cutPoint + 1);
      }
      return truncated + '...';
    }
    return cleaned;
  }

  // 回退到标题
  return `关于"${article.title}"的文章`;
}

/**
 * 延迟函数（用于限流）
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 批量生成摘要（带 AI 降级）
 *
 * 工作流程：
 * 1. 如果有 AI 配置，尝试调用 AI 生成摘要
 * 2. 如果 AI 失败或无配置，使用降级策略
 * 3. 每篇文章间隔 500ms（避免 API 限流）
 *
 * @param articles - 文章数组
 * @param summarizeWithAI - AI 摘要函数（可选）
 * @returns 带摘要的文章数组
 */
export async function summarizeWithFallback(
  articles: Article[],
  summarizeWithAI?: (article: Article) => Promise<string>
): Promise<Article[]> {
  const results: Article[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    let summary = '';
    let usedFallback = false;

    try {
      // 尝试 AI 摘要
      if (summarizeWithAI) {
        console.log(`[${i + 1}/${articles.length}] Generating AI summary for: ${article.title.substring(0, 50)}...`);
        summary = await summarizeWithAI(article);

        // 验证 AI 摘要是否有效
        if (!summary || summary.length < 10) {
          throw new Error('AI summary too short or empty');
        }

        // 限流：每篇文章间隔 500ms
        if (i < articles.length - 1) {
          await delay(500);
        }
      } else {
        // 无 AI 配置，直接使用降级
        usedFallback = true;
      }
    } catch (error) {
      // AI 失败，使用降级策略
      console.warn(`AI summary failed for "${article.title.substring(0, 50)}...": ${error.message}`);
      usedFallback = true;
    }

    // 使用降级摘要
    if (usedFallback || !summary) {
      console.log(`[${i + 1}/${articles.length}] Using fallback summary for: ${article.title.substring(0, 50)}...`);
      summary = generateFallbackSummary(article);
    }

    results.push({
      ...article,
      summary
    });
  }

  return results;
}

/**
 * 生成测试用的批量降级摘要（不使用 AI）
 *
 * @param articles - 文章数组
 * @returns 带简略摘要的文章数组
 */
export function generateFallbackSummaries(articles: Article[]): Article[] {
  return articles.map(article => ({
    ...article,
    summary: generateFallbackSummary(article)
  }));
}
