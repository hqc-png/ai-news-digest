/**
 * D1 Database Utility Functions
 * Cloudflare D1 数据库操作工具
 */

import type { Article } from './types';

/**
 * D1 数据库接口（从 Cloudflare runtime 获取）
 */
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  dump(): Promise<ArrayBuffer>;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
}

interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  error?: string;
  meta: {
    duration: number;
    size_after?: number;
    rows_read?: number;
    rows_written?: number;
  };
}

interface D1ExecResult {
  count: number;
  duration: number;
}

/**
 * 保存文章到 D1 数据库（批量插入）
 *
 * @param db - D1 数据库实例
 * @param articles - 文章数组
 * @returns 插入成功的文章数量
 */
export async function saveArticlesToD1(
  db: D1Database,
  articles: Article[]
): Promise<number> {
  if (!articles || articles.length === 0) {
    console.log('No articles to save');
    return 0;
  }

  console.log(`\n💾 Saving ${articles.length} articles to D1...`);

  let savedCount = 0;
  let skippedCount = 0;

  for (const article of articles) {
    try {
      // 检查是否已存在（根据 URL 去重）
      const existing = await db
        .prepare('SELECT id FROM articles WHERE url = ?')
        .bind(article.link)
        .first();

      if (existing) {
        skippedCount++;
        continue;
      }

      // 插入新文章
      const result = await db
        .prepare(`
          INSERT INTO articles (title, url, content, summary, source, date)
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          article.title,
          article.link,
          article.content || '',
          article.summary || '',
          article.source,
          article.publishedAt.toISOString()
        )
        .run();

      if (result.success) {
        savedCount++;
      }
    } catch (error) {
      console.error(`Failed to save article: ${article.title}`, error);
    }
  }

  console.log(`✅ Saved: ${savedCount}, Skipped (duplicates): ${skippedCount}`);
  return savedCount;
}

/**
 * 获取文章列表（分页）
 *
 * @param db - D1 数据库实例
 * @param page - 页码（从 1 开始）
 * @param limit - 每页数量
 * @returns 文章数组
 */
export async function getArticles(
  db: D1Database,
  page: number = 1,
  limit: number = 20
): Promise<Article[]> {
  const offset = (page - 1) * limit;

  const result = await db
    .prepare(`
      SELECT id, title, url, content, summary, source, date, created_at
      FROM articles
      ORDER BY date DESC
      LIMIT ? OFFSET ?
    `)
    .bind(limit, offset)
    .all();

  if (!result.results) {
    return [];
  }

  return result.results.map((row: any) => ({
    title: row.title,
    link: row.url,
    content: row.content,
    summary: row.summary,
    source: row.source,
    publishedAt: new Date(row.date),
  }));
}

/**
 * 根据 ID 获取单篇文章
 *
 * @param db - D1 数据库实例
 * @param id - 文章 ID
 * @returns 文章对象或 null
 */
export async function getArticleById(
  db: D1Database,
  id: number
): Promise<Article | null> {
  const row: any = await db
    .prepare(`
      SELECT id, title, url, content, summary, source, date, created_at
      FROM articles
      WHERE id = ?
    `)
    .bind(id)
    .first();

  if (!row) {
    return null;
  }

  return {
    title: row.title,
    link: row.url,
    content: row.content,
    summary: row.summary,
    source: row.source,
    publishedAt: new Date(row.date),
  };
}

/**
 * 搜索文章（使用 FTS5 全文搜索）
 *
 * @param db - D1 数据库实例
 * @param query - 搜索关键词
 * @param limit - 返回数量限制
 * @returns 文章数组
 */
export async function searchArticles(
  db: D1Database,
  query: string,
  limit: number = 20
): Promise<Article[]> {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const result = await db
    .prepare(`
      SELECT id, title, url, content, summary, source, date
      FROM articles
      WHERE id IN (
        SELECT rowid FROM articles_fts
        WHERE articles_fts MATCH ?
      )
      ORDER BY date DESC
      LIMIT ?
    `)
    .bind(query, limit)
    .all();

  if (!result.results) {
    return [];
  }

  return result.results.map((row: any) => ({
    title: row.title,
    link: row.url,
    content: row.content,
    summary: row.summary,
    source: row.source,
    publishedAt: new Date(row.date),
  }));
}

/**
 * 获取文章总数
 *
 * @param db - D1 数据库实例
 * @returns 文章总数
 */
export async function getArticleCount(db: D1Database): Promise<number> {
  const result: any = await db
    .prepare('SELECT COUNT(*) as count FROM articles')
    .first();

  return result?.count || 0;
}

/**
 * 清理旧文章（删除 N 天前的数据）
 *
 * @param db - D1 数据库实例
 * @param days - 保留天数（默认 7 天）
 * @returns 删除的文章数量
 */
export async function cleanupOldArticles(
  db: D1Database,
  days: number = 7
): Promise<number> {
  console.log(`\n🗑️  Cleaning up articles older than ${days} days...`);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const result = await db
    .prepare('DELETE FROM articles WHERE date < ?')
    .bind(cutoffDate.toISOString())
    .run();

  const deletedCount = result.meta?.rows_written || 0;
  console.log(`✅ Deleted ${deletedCount} old articles`);

  return deletedCount;
}

/**
 * 获取按来源分组的文章统计
 *
 * @param db - D1 数据库实例
 * @returns 来源统计数组
 */
export async function getArticleStats(
  db: D1Database
): Promise<Array<{ source: string; count: number }>> {
  const result = await db
    .prepare(`
      SELECT source, COUNT(*) as count
      FROM articles
      GROUP BY source
      ORDER BY count DESC
    `)
    .all();

  if (!result.results) {
    return [];
  }

  return result.results as Array<{ source: string; count: number }>;
}
