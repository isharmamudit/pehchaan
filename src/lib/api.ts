/**
 * Thin client for the edge functions. No API keys ever reach the browser —
 * only the function URL and the public anon key.
 */

const BASE = (import.meta.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '');
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export type FunctionName =
  | 'analyze'
  | 'check-urls'
  | 'fact-check'
  | 'spar'
  | 'debrief'
  | 'xray'
  | 'ocr';

export interface CallOk<T> {
  ok: true;
  data: T;
}

export interface CallErr {
  ok: false;
  error: string;
  status?: number;
}

export type CallResult<T> = CallOk<T> | CallErr;

export function backendConfigured(): boolean {
  return BASE.length > 0;
}

export async function callFunction<T>(
  name: FunctionName,
  body: unknown,
  { timeoutMs = 12000 }: { timeoutMs?: number } = {},
): Promise<CallResult<T>> {
  if (!BASE) {
    return { ok: false, error: 'backend_not_configured' };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${BASE}/functions/v1/${name}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(ANON ? { authorization: `Bearer ${ANON}`, apikey: ANON } : {}),
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      return { ok: false, error: `http_${res.status}`, status: res.status };
    }
    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (err) {
    const aborted = err instanceof DOMException && err.name === 'AbortError';
    return { ok: false, error: aborted ? 'timeout' : 'network_error' };
  } finally {
    clearTimeout(timer);
  }
}
