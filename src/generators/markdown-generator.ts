import { format } from 'date-fns';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import type { Article } from '../types.js';

export function generateMarkdown(articles: Article[], date: Date): string {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dateDisplay = format(date, 'MMMM dd, yyyy');

  let markdown = `# AI News Digest - ${dateDisplay}\n\n`;
  markdown += `> 📰 Total articles: ${articles.length}\n`;
  markdown += `> ⏰ Last 24 hours\n`;
  markdown += `> 🤖 AI-powered summaries\n\n`;
  markdown += `---\n\n`;

  if (articles.length === 0) {
    markdown += `No articles found in the last 24 hours.\n`;
    return markdown;
  }

  const articlesBySource = new Map<string, Article[]>();
  for (const article of articles) {
    if (!articlesBySource.has(article.source)) {
      articlesBySource.set(article.source, []);
    }
    articlesBySource.get(article.source)!.push(article);
  }

  for (const article of articles) {
    const timeStr = format(article.publishedAt, 'HH:mm');
    markdown += `## ${article.title}\n\n`;

    if (article.summary) {
      markdown += `**📝 摘要**: ${article.summary}\n\n`;
    }

    markdown += `- 🔗 **Link**: [Read more](${article.link})\n`;
    markdown += `- 📰 **Source**: ${article.source}\n`;
    markdown += `- 🕒 **Published**: ${format(article.publishedAt, 'yyyy-MM-dd HH:mm')}\n\n`;
    markdown += `---\n\n`;
  }

  markdown += `\n## 📊 Statistics by Source\n\n`;
  for (const [source, sourceArticles] of articlesBySource) {
    markdown += `- **${source}**: ${sourceArticles.length} articles\n`;
  }

  markdown += `\n---\n\n`;
  markdown += `*Generated at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}*\n`;

  return markdown;
}

export async function saveMarkdown(
  markdown: string,
  outputDir: string = 'output'
): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const filename = `ai-news-${format(new Date(), 'yyyy-MM-dd')}.md`;
  const filepath = join(outputDir, filename);

  await writeFile(filepath, markdown, 'utf-8');

  return filepath;
}
