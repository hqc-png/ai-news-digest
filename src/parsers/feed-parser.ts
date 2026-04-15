import Parser from 'rss-parser';
import type { Article } from '../types.js';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'AI-News-Digest/1.0',
  },
});

export async function parseFeed(feedUrl: string, sourceName: string): Promise<Article[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    const articles: Article[] = [];

    for (const item of feed.items) {
      if (!item.title || !item.link) {
        continue;
      }

      const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();

      articles.push({
        title: item.title.trim(),
        link: item.link.trim(),
        publishedAt,
        source: sourceName,
      });
    }

    return articles;
  } catch (error) {
    throw new Error(`Failed to parse feed from ${sourceName}: ${error}`);
  }
}
