/**
 * API: 获取文章列表
 * GET /api/articles?page=1&limit=20
 */

import { getArticles } from '../../lib/db';

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
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const limit = parseInt(url.searchParams.get('limit') || '20', 10);

    // 验证参数
    if (page < 1 || limit < 1 || limit > 100) {
      return new Response(
        JSON.stringify({ error: 'Invalid parameters' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const articles = await getArticles(env.DB, page, limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: articles,
        pagination: {
          page,
          limit,
          count: articles.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API /api/articles error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
