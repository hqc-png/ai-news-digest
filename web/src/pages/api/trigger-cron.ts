/**
 * Manual trigger for scheduled task (testing only)
 * 手动触发定时任务用于测试
 */

import { RSS_SOURCES } from '../../lib/sources';
import { fetchAllFeeds } from '../../lib/rss-fetcher-cloudflare';
import { filterLast24Hours, sortByDateDesc } from '../../lib/time-filter';
import { summarizeArticles } from '../../lib/ai-summarizer';
import { getAIConfig } from '../../lib/ai-config';
import { saveArticlesToD1, cleanupOldArticles } from '../../lib/db';

export async function GET({ locals }) {
  const startTime = Date.now();
  const { env } = locals.runtime;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'D1 database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 Manual trigger: Starting scheduled task...');
    console.log('='.repeat(60) + '\n');

    // Step 1: 清理旧数据
    const deletedCount = await cleanupOldArticles(env.DB, 7);

    // Step 2: 抓取 RSS
    const allArticles = await fetchAllFeeds(RSS_SOURCES);

    if (allArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No articles fetched',
          duration: Date.now() - startTime
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: 过滤最近 24 小时
    const recentArticles = filterLast24Hours(allArticles);
    console.log(`\n📅 Filtered to ${recentArticles.length} articles from last 24 hours`);

    if (recentArticles.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No recent articles found',
          totalFetched: allArticles.length,
          duration: Date.now() - startTime
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Step 4: 排序
    const sortedArticles = sortByDateDesc(recentArticles);

    // Step 5: 生成摘要
    const aiConfig = getAIConfig(env);
    const articlesWithSummaries = await summarizeArticles(sortedArticles, aiConfig);

    // Step 6: 保存到数据库
    const savedCount = await saveArticlesToD1(env.DB, articlesWithSummaries);

    const duration = Date.now() - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('✅ Task completed successfully!');
    console.log('='.repeat(60) + '\n');

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalFetched: allArticles.length,
          recentArticles: recentArticles.length,
          savedToDb: savedCount,
          deletedOld: deletedCount,
          aiProvider: aiConfig ? aiConfig.provider : 'fallback only',
          duration: `${(duration / 1000).toFixed(2)}s`
        },
        articles: articlesWithSummaries.slice(0, 3).map(a => ({
          title: a.title,
          source: a.source,
          summary: a.summary?.substring(0, 100) + '...'
        }))
      }, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Task failed:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
