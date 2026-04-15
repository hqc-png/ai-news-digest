/**
 * Cloudflare Workers Scheduled Event Handler
 * 定时任务：每日抓取 AI 新闻并生成摘要
 */

import { RSS_SOURCES } from '../lib/sources';
import { fetchAllFeeds } from '../lib/rss-fetcher';
import { filterLast24Hours, sortByDateDesc } from '../lib/time-filter';
import { summarizeArticles } from '../lib/ai-summarizer';
import { getAIConfig } from '../lib/ai-config';
import { saveArticlesToD1, cleanupOldArticles } from '../lib/db';

interface Env {
  DB: D1Database;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
  OPENAI_MODEL?: string;
  ANTHROPIC_BASE_URL?: string;
}

interface ScheduledEvent {
  scheduledTime: number;
  cron: string;
}

/**
 * Scheduled event handler
 * 每天 9:00 AM UTC 自动触发
 */
export const onRequestGet = async (context: { env: Env }) => {
  return await scheduled({} as ScheduledEvent, context.env);
};

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    try {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🕐 Scheduled task started at ${new Date(event.scheduledTime).toISOString()}`);
      console.log(`⏰ Cron pattern: ${event.cron}`);
      console.log(`${'='.repeat(60)}\n`);

      // Step 1: 清理 7 天前的旧数据
      await cleanupOldArticles(env.DB, 7);

      // Step 2: 抓取 RSS feeds
      const allArticles = await fetchAllFeeds(RSS_SOURCES);

      if (allArticles.length === 0) {
        console.log('⚠️  No articles fetched, task completed.');
        return;
      }

      // Step 3: 过滤 24 小时内的文章
      const recentArticles = filterLast24Hours(allArticles);
      console.log(`\n📅 Filtered to ${recentArticles.length} articles from last 24 hours`);

      if (recentArticles.length === 0) {
        console.log('⚠️  No recent articles found, task completed.');
        return;
      }

      // Step 4: 按时间排序
      const sortedArticles = sortByDateDesc(recentArticles);

      // Step 5: 生成 AI 摘要（带降级）
      const aiConfig = getAIConfig(env);
      const articlesWithSummaries = await summarizeArticles(sortedArticles, aiConfig);

      // Step 6: 保存到 D1 数据库
      const savedCount = await saveArticlesToD1(env.DB, articlesWithSummaries);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`✅ Task completed successfully!`);
      console.log(`📊 Summary:`);
      console.log(`   - Total fetched: ${allArticles.length}`);
      console.log(`   - Recent (24h): ${recentArticles.length}`);
      console.log(`   - Saved to DB: ${savedCount}`);
      console.log(`   - AI provider: ${aiConfig ? aiConfig.provider : 'fallback only'}`);
      console.log(`${'='.repeat(60)}\n`);
    } catch (error) {
      console.error('❌ Scheduled task failed:', error);
      throw error;
    }
  }
};

/**
 * Manual trigger function for testing
 */
async function scheduled(event: ScheduledEvent, env: Env) {
  const handler = await import('./scheduled');
  await handler.default.scheduled(event, env, {} as ExecutionContext);

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Scheduled task executed manually',
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}
