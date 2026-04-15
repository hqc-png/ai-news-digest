/**
 * Test API for D1 Database Utilities
 * 测试 D1 数据库工具函数
 */

import {
  saveArticlesToD1,
  getArticles,
  getArticleById,
  searchArticles,
  getArticleCount,
  cleanupOldArticles,
  getArticleStats
} from '../../lib/db';
import type { Article } from '../../lib/types';

export async function GET({ locals, url }) {
  const action = url.searchParams.get('action') || 'count';
  const { env } = locals.runtime;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'D1 database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    let result: any;

    switch (action) {
      case 'count':
        // 获取文章总数
        const count = await getArticleCount(env.DB);
        result = { action: 'count', count };
        break;

      case 'insert':
        // 插入测试文章
        const testArticles: Article[] = [
          {
            title: 'Test Article 1 - AI Breakthrough',
            link: `https://test.com/article-${Date.now()}-1`,
            publishedAt: new Date(),
            source: 'Test Source',
            content: 'This is a test article about artificial intelligence breakthroughs.',
            summary: 'AI makes significant progress in natural language understanding.'
          },
          {
            title: 'Test Article 2 - Machine Learning',
            link: `https://test.com/article-${Date.now()}-2`,
            publishedAt: new Date(),
            source: 'Test Source',
            content: 'Machine learning models are becoming more efficient and accurate.',
            summary: 'New ML techniques improve model performance by 40%.'
          }
        ];

        const savedCount = await saveArticlesToD1(env.DB, testArticles);
        result = { action: 'insert', savedCount, total: testArticles.length };
        break;

      case 'list':
        // 获取文章列表
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const articles = await getArticles(env.DB, page, limit);
        result = {
          action: 'list',
          page,
          limit,
          count: articles.length,
          articles: articles.map(a => ({
            title: a.title,
            source: a.source,
            date: a.publishedAt,
            summaryLength: a.summary?.length || 0
          }))
        };
        break;

      case 'get':
        // 获取单篇文章
        const id = parseInt(url.searchParams.get('id') || '1');
        const article = await getArticleById(env.DB, id);
        result = { action: 'get', id, article };
        break;

      case 'search':
        // 搜索文章
        const query = url.searchParams.get('q') || 'AI';
        const searchResults = await searchArticles(env.DB, query, 5);
        result = {
          action: 'search',
          query,
          count: searchResults.length,
          results: searchResults.map(a => ({
            title: a.title,
            source: a.source,
            date: a.publishedAt
          }))
        };
        break;

      case 'stats':
        // 获取统计信息
        const stats = await getArticleStats(env.DB);
        const total = await getArticleCount(env.DB);
        result = { action: 'stats', total, bySource: stats };
        break;

      case 'cleanup':
        // 清理旧文章（测试用，清理 30 天前的）
        const days = parseInt(url.searchParams.get('days') || '30');
        const deletedCount = await cleanupOldArticles(env.DB, days);
        result = { action: 'cleanup', days, deletedCount };
        break;

      default:
        return new Response(
          JSON.stringify({
            error: 'Invalid action',
            availableActions: ['count', 'insert', 'list', 'get', 'search', 'stats', 'cleanup']
          }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, ...result }, null, 2),
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
