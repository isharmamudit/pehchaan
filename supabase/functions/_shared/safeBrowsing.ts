/** Google Safe Browsing Lookup API v4, one batched call per request. */

const ENDPOINT = 'https://safebrowsing.googleapis.com/v4/threatMatches:find';

export interface SafeBrowsingHit {
  url: string;
  threatType: string;
}

export type SafeBrowsingOutcome =
  | { ok: true; hits: SafeBrowsingHit[] }
  | { ok: false };

export async function lookupThreats(urls: string[]): Promise<SafeBrowsingOutcome> {
  const key = Deno.env.get('GOOGLE_API_KEY');
  if (!key || !urls.length) return { ok: false };

  const body = {
    client: { clientId: 'pehchaan', clientVersion: '1.0.0' },
    threatInfo: {
      threatTypes: [
        'MALWARE',
        'SOCIAL_ENGINEERING',
        'UNWANTED_SOFTWARE',
        'POTENTIALLY_HARMFUL_APPLICATION',
      ],
      platformTypes: ['ANY_PLATFORM'],
      threatEntryTypes: ['URL'],
      threatEntries: [...new Set(urls)].slice(0, 500).map((url) => ({ url })),
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) return { ok: false };

    const data = (await res.json()) as {
      matches?: Array<{ threat?: { url?: string }; threatType?: string }>;
    };

    const hits = (data.matches ?? [])
      .filter((m) => m.threat?.url)
      .map((m) => ({ url: m.threat!.url!, threatType: m.threatType ?? 'UNKNOWN' }));

    return { ok: true, hits };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}
