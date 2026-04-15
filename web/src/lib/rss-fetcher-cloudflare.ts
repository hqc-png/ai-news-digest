/**
 * Cloudflare Workers 兼容的 RSS 抓取器
 * 使用 fetch API 替代 Node.js 的 http/https 模块
 */

export interface RSSSource {
  name: string;
  url: string;
}

export interface Article {
  title: string;
  link: string;
  publishedAt: Date;
  source: string;
  content: string;
  summary: string;
}

interface RSSFeed {
  title?: string;
  items?: Array<{
    title?: string;
    link?: string;
    pubDate?: string;
    contentSnippet?: string;
    content?: string;
    isoDate?: string;
  }>;
}

/**
 * 简单的 XML 解析函数
 */
function parseRSSXML(xmlText: string): RSSFeed {
  const items: RSSFeed['items'] = [];

  // 提取所有 <item> 标签内容
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let itemMatch;

  while ((itemMatch = itemRegex.exec(xmlText)) !== null) {
    const itemContent = itemMatch[1];

    // 提取各个字段
    const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(itemContent);
    const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/i.exec(itemContent);
    const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i.exec(itemContent);
    const descMatch = /<description[^>]*>([\s\S]*?)<\/description>/i.exec(itemContent);
    const contentMatch = /<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i.exec(itemContent);

    items.push({
      title: titleMatch ? decodeHTML(titleMatch[1].trim()) : '',
      link: linkMatch ? linkMatch[1].trim() : '',
      pubDate: pubDateMatch ? pubDateMatch[1].trim() : '',
      isoDate: pubDateMatch ? pubDateMatch[1].trim() : '',
      contentSnippet: descMatch ? stripHTML(decodeHTML(descMatch[1].trim())).substring(0, 200) : '',
      content: contentMatch ? decodeHTML(contentMatch[1].trim()) : '',
    });
  }

  return { items };
}

/**
 * 去除 HTML 标签
 */
function stripHTML(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * 解码 HTML 实体
 */
function decodeHTML(html: string): string {
  const entities: Record<string, string> = {
    '&lt;': '<',
    '&gt;': '>',
    '&amp;': '&',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  return html.replace(/&[^;]+;/g, (entity) => entities[entity] || entity);
}

/**
 * 抓取单个 RSS 源
 */
async function fetchSingleFeed(source: RSSSource, retries = 3): Promise<Article[]> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`📡 Fetching ${source.name} (attempt ${attempt}/${retries})...`);

      const response = await fetch(source.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AI-News-Digest/1.0)',
        },
        signal: AbortSignal.timeout(10000), // 10 秒超时
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      const feed = parseRSSXML(xmlText);

      if (!feed.items || feed.items.length === 0) {
        console.log(`⚠️  ${source.name}: No items found`);
        return [];
      }

      const articles: Article[] = feed.items.map(item => ({
        title: item.title || 'Untitled',
        link: item.link || '',
        publishedAt: item.isoDate ? new Date(item.isoDate) : new Date(),
        source: source.name,
        content: item.contentSnippet || item.content || '',
        summary: '', // 稍后填充
      }));

      console.log(`✅ ${source.name}: ${articles.length} articles fetched`);
      return articles;

    } catch (error) {
      console.error(`❌ ${source.name} (attempt ${attempt}): ${error.message}`);

      if (attempt === retries) {
        console.error(`❌ ${source.name}: All retries failed`);
        return [];
      }

      // 等待后重试
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }

  return [];
}

/**
 * 并发抓取所有 RSS 源
 */
export async function fetchAllFeeds(sources: RSSSource[]): Promise<Article[]> {
  console.log(`\n🚀 Starting to fetch ${sources.length} RSS sources...\n`);

  const results = await Promise.all(
    sources.map(source => fetchSingleFeed(source))
  );

  const allArticles = results.flat();

  console.log(`\n✅ Total articles fetched: ${allArticles.length}\n`);

  return allArticles;
}
