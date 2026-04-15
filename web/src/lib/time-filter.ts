import { subHours } from 'date-fns';
import type { Article } from './types';

export function filterLast24Hours(articles: Article[]): Article[] {
  const twentyFourHoursAgo = subHours(new Date(), 24);

  return articles.filter(article => {
    return article.publishedAt >= twentyFourHoursAgo;
  });
}

export function sortByDateDesc(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => {
    return b.publishedAt.getTime() - a.publishedAt.getTime();
  });
}
