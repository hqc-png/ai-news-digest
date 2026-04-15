// Test D1 connection
export async function GET({ locals }) {
  try {
    const { env } = locals.runtime;

    if (!env.DB) {
      return new Response(
        JSON.stringify({
          error: 'D1 binding not found',
          hint: 'Make sure wrangler.toml has DB binding configured'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Test query
    const result = await env.DB.prepare(
      'SELECT name, type FROM sqlite_master WHERE type="table" ORDER BY name LIMIT 5'
    ).all();

    return new Response(
      JSON.stringify({
        success: true,
        database: 'ai-digest',
        tables: result.results,
        message: 'D1 connection successful!'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        stack: error.stack
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
