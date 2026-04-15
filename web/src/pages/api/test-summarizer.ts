/**
 * Test API for AI Summarization with Fallback
 * 测试 AI 摘要和降级功能
 */

import { generateFallbackSummary, summarizeWithFallback } from '../../lib/fallback-summarizer';
import type { Article } from '../../lib/types';

export async function GET({ url }) {
  const mode = url.searchParams.get('mode') || 'fallback';

  // 测试文章
  const testArticles: Article[] = [
    {
      title: 'OpenAI Launches GPT-5 with Enhanced Reasoning Capabilities',
      link: 'https://example.com/gpt5',
      publishedAt: new Date(),
      source: 'Test Source',
      content: 'OpenAI has announced the release of GPT-5, featuring significantly improved reasoning capabilities and better understanding of complex queries. The new model demonstrates 40% better performance on mathematical problems and can handle longer context windows up to 200,000 tokens. This represents a major leap forward in language model technology.'
    },
    {
      title: '测试中文文章标题',
      link: 'https://example.com/test-cn',
      publishedAt: new Date(),
      source: 'Test Source',
      content: '这是一篇测试文章。人工智能技术正在快速发展，深度学习模型变得越来越强大。研究人员正在探索新的方法来提高模型的效率和准确性。'
    },
    {
      title: 'Short Title Only Article',
      link: 'https://example.com/short',
      publishedAt: new Date(),
      source: 'Test Source',
      content: 'Short content.'
    }
  ];

  try {
    let results: Article[];

    if (mode === 'fallback') {
      // 仅测试降级摘要
      console.log('Testing fallback summarization...');
      results = testArticles.map(article => ({
        ...article,
        summary: generateFallbackSummary(article)
      }));
    } else if (mode === 'ai') {
      // 测试 AI 摘要（会自动降级如果失败）
      console.log('Testing AI summarization with fallback...');

      // 这里故意不传 AI config，会自动降级
      results = await summarizeWithFallback(testArticles);
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use ?mode=fallback or ?mode=ai' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        count: results.length,
        articles: results.map(a => ({
          title: a.title,
          summary: a.summary,
          summaryLength: a.summary?.length || 0
        }))
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
