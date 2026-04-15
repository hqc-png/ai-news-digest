/**
 * API: 获取文章总数
 * GET /api/count
 */

import { getArticleCount } from '../../lib/db';

export async function GET({ locals }) {
  const { env } = locals.runtime;

  if (!env.DB) {
    return new Response(
      JSON.stringify({ error: 'Database not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const count = await getArticleCount(env.DB);

    return new Response(
      JSON.stringify({
        success: true,
        count
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('API /api/count error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
