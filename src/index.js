export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // POST /api/shorten - create short URL
    if (url.pathname === '/api/shorten' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { longUrl } = body;

        if (!longUrl) {
          return new Response(JSON.stringify({ error: 'longUrl required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Generate random code
        const code = generateCode(4);

        // Save to KV
        await env.URLS.put(code, longUrl);

        const shortUrl = `https://pvlm.site/s/${code}`;

        return new Response(JSON.stringify({ shortUrl, code }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // GET /{code} or /s/{code} - redirect
    if (url.pathname.length > 1) {
      const code = url.pathname.startsWith('/s/') ? url.pathname.slice(3) : url.pathname.slice(1);
      const longUrl = await env.URLS.get(code);

      if (longUrl) {
        return Response.redirect(longUrl, 302);
      }
    }

    // Serve static assets (index.html for /)
    return env.ASSETS.fetch(request);
  },
};

function generateCode(length) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}
