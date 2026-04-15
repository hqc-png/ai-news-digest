import chalk from 'chalk';
import type { RSSSource, FetchResult, Article } from '../types.js';
import { parseFeed } from '../parsers/feed-parser.js';

async function fetchWithRetry(
  source: RSSSource,
  maxRetries: number = 3
): Promise<FetchResult> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(chalk.blue(`📡 Fetching ${source.name}... (attempt ${attempt}/${maxRetries})`));

      const articles = await parseFeed(source.url, source.name);

      console.log(chalk.green(`✓ ${source.name}: ${articles.length} articles fetched`));

      return {
        source: source.name,
        articles,
      };
    } catch (error) {
      lastError = error as Error;
      console.log(chalk.yellow(`⚠ ${source.name}: Attempt ${attempt} failed`));

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  console.log(chalk.red(`✗ ${source.name}: All attempts failed`));

  return {
    source: source.name,
    articles: [],
    error: lastError?.message || 'Unknown error',
  };
}

export async function fetchAllFeeds(sources: RSSSource[]): Promise<Article[]> {
  console.log(chalk.bold.cyan('\n🚀 Starting to fetch RSS feeds...\n'));

  const results = await Promise.all(
    sources.map(source => fetchWithRetry(source))
  );

  const allArticles: Article[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const result of results) {
    if (result.error) {
      failCount++;
    } else {
      successCount++;
      allArticles.push(...result.articles);
    }
  }

  console.log(chalk.bold.cyan('\n📊 Fetch Summary:'));
  console.log(chalk.green(`  ✓ Successful: ${successCount}`));
  console.log(chalk.red(`  ✗ Failed: ${failCount}`));
  console.log(chalk.white(`  📄 Total articles: ${allArticles.length}\n`));

  return allArticles;
}
