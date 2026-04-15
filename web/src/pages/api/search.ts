/**
 * API: 搜索文章（FTS5 全文搜索）
 * GET /api/search?q=keyword
 */

import { searchArticles } from '../../lib/db';

export async function GET({ request, locals }) {
  const { env } = locals.runtime;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing search query' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = await searchArticles(env.DB, query.trim());

    return new Response(
      JSON.stringify({
        success: true,
        query: query.trim(),
        count: results.length,
        data: results
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API /api/search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
