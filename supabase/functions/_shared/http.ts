/**
 * CORS, JSON responses and request logging.
 * Logs carry the function name, status and duration only — never bodies,
 * never AI output, never URLs, never images.
 */

const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function allowedOrigins(): string[] {
  const configured = (Deno.env.get('ALLOWED_ORIGIN') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return configured.length ? configured : DEFAULT_ORIGINS;
}

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowed = allowedOrigins();
  const match = allowed.includes('*')
    ? origin || '*'
    : allowed.find((o) => o === origin);

  return {
    'access-control-allow-origin': match ?? allowed[0]!,
    'access-control-allow-headers':
      'authorization, x-client-info, apikey, content-type',
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

export function json(
  req: Request,
  body: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'content-type': 'application/json' },
  });
}

export function preflight(req: Request): Response {
  return new Response('ok', { headers: corsHeaders(req) });
}

export function clientIp(req: Request): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    'unknown'
  );
}

export interface HandlerOptions {
  name: string;
  handler: (req: Request) => Promise<Response>;
}

/** Wraps a handler with preflight, timing, safe logging and a safe error shape. */
export function serveFunction({ name, handler }: HandlerOptions) {
  return async (req: Request): Promise<Response> => {
    if (req.method === 'OPTIONS') return preflight(req);

    const started = Date.now();
    let status = 500;
    try {
      if (req.method !== 'POST') {
        status = 405;
        return json(req, { error: 'method_not_allowed' }, 405);
      }
      const res = await handler(req);
      status = res.status;
      return res;
    } catch (_err) {
      // Deliberately not logging the error body: it can contain user content.
      status = 500;
      return json(req, { error: 'internal_error' }, 500);
    } finally {
      console.log(`${name} ${status} ${Date.now() - started}ms`);
    }
  };
}
