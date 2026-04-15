export interface Article {
  title: string;
  link: string;
  publishedAt: Date;
  source: string;
  summary?: string;
  content?: string;
}

export interface RSSSource {
  name: string;
  url: string;
  parser?: (item: any) => Partial<Article>;
}

export interface FetchResult {
  source: string;
  articles: Article[];
  error?: string;
}

export interface AIConfig {
  provider: 'anthropic' | 'openai';
  apiKey: string;
  model?: string;
  baseURL?: string;
}
