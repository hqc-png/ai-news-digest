import axios from 'axios';
import * as cheerio from 'cheerio';

export async function fetchArticleContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    $('script, style, nav, header, footer, aside, iframe').remove();

    const articleSelectors = [
      'article',
      '[role="main"]',
      '.article-content',
      '.post-content',
      '.entry-content',
      'main',
    ];

    let content = '';
    for (const selector of articleSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text();
        break;
      }
    }

    if (!content) {
      content = $('body').text();
    }

    content = content
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 5000);

    return content;
  } catch (error) {
    return '';
  }
}
