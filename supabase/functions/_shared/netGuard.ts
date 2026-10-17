/**
 * SSRF guard for redirect expansion. http/https only; localhost, private,
 * link-local, CGNAT and cloud-metadata targets are refused before each request.
 */

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  'instance-data',
  'metadata.goog',
]);

const BLOCKED_SUFFIXES = ['.localhost', '.local', '.internal', '.home.arpa', '.onion'];

function ipv4ToParts(ip: string): number[] | null {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return null;
  return nums;
}

export function isPrivateIpv4(ip: string): boolean {
  const p = ipv4ToParts(ip);
  if (!p) return false;
  const [a, b] = p as [number, number, number, number];
  if (a === 0) return true;                       // 0.0.0.0/8
  if (a === 10) return true;                      // private
  if (a === 127) return true;                     // loopback
  if (a === 169 && b === 254) return true;        // link-local + metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true;          // 192.0.0.0/24 and 192.0.2.0/24
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 198 && (b === 18 || b === 19)) return true;
  if (a >= 224) return true;                      // multicast + reserved
  return false;
}

export function isPrivateIpv6(ip: string): boolean {
  const addr = ip.toLowerCase().replace(/^\[|\]$/g, '');
  if (addr === '::1' || addr === '::' ) return true;
  if (addr.startsWith('fc') || addr.startsWith('fd')) return true; // unique local
  if (addr.startsWith('fe80')) return true;                        // link-local
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]!);
  return false;
}

export function isLiteralIp(host: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.includes(':');
}

export function isBlockedHostname(host: string): boolean {
  const h = host.toLowerCase().replace(/\.$/, '');
  if (BLOCKED_HOSTNAMES.has(h)) return true;
  if (BLOCKED_SUFFIXES.some((s) => h.endsWith(s))) return true;
  if (isLiteralIp(h)) {
    return h.includes(':') ? isPrivateIpv6(h) : isPrivateIpv4(h);
  }
  return false;
}

/**
 * Resolve the hostname where the runtime allows it and check every address.
 * When DNS is not available to the function, the hostname checks above stand.
 */
export async function resolvesToPrivateAddress(host: string): Promise<boolean> {
  const resolve = (Deno as unknown as { resolveDns?: typeof Deno.resolveDns }).resolveDns;
  if (typeof resolve !== 'function' || isLiteralIp(host)) return false;

  try {
    const [v4, v6] = await Promise.allSettled([
      resolve(host, 'A'),
      resolve(host, 'AAAA'),
    ]);
    const addresses = [
      ...(v4.status === 'fulfilled' ? v4.value : []),
      ...(v6.status === 'fulfilled' ? v6.value : []),
    ];
    if (!addresses.length) return false;
    return addresses.some((a) => (a.includes(':') ? isPrivateIpv6(a) : isPrivateIpv4(a)));
  } catch {
    return false;
  }
}

export interface UrlCheck {
  ok: boolean;
  reason?: string;
  url?: URL;
}

export async function safeUrl(raw: string): Promise<UrlCheck> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, reason: 'invalid_url' };
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, reason: 'unsupported_scheme' };
  }
  if (isBlockedHostname(url.hostname)) {
    return { ok: false, reason: 'blocked_host' };
  }
  if (await resolvesToPrivateAddress(url.hostname)) {
    return { ok: false, reason: 'blocked_host' };
  }
  return { ok: true, url };
}
