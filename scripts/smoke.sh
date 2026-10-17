#!/usr/bin/env bash
# Live smoke test for all seven edge functions.
# Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from .env.local.
# Prints the HTTP status and a short extract of each response.
set -uo pipefail

cd "$(dirname "$0")/.."
[ -f .env.local ] || { echo "missing .env.local"; exit 1; }
# shellcheck disable=SC1091
set -a; . ./.env.local; set +a

BASE="${VITE_SUPABASE_URL%/}/functions/v1"
AUTH=(-H "authorization: Bearer ${VITE_SUPABASE_ANON_KEY}" -H "apikey: ${VITE_SUPABASE_ANON_KEY}")
JSON=(-H 'content-type: application/json' -H 'origin: http://localhost:5173')

call() {
  local name="$1" body="$2"
  local out status
  out=$(curl -sS -m 40 -w '\n%{http_code}' "${AUTH[@]}" "${JSON[@]}" -d "$body" "$BASE/$name" 2>&1)
  status=$(printf '%s' "$out" | tail -1)
  printf '\n=== %s  [HTTP %s] ===\n' "$name" "$status"
  printf '%s' "$out" | sed '$d' | head -c 900
  printf '\n'
}

# A 1x1 white JPEG, so the vision endpoints get a real image without a fixture file.
PIXEL='/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a
HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUB
AQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1Fh
ByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNk
ZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT
1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q=='
PIXEL=$(printf '%s' "$PIXEL" | tr -d '\n')

call analyze '{"text":"Dear Customer, your account will be BLOCKED within 24 hrs. Share the OTP sent to [PHONE_1].","language":"en","inputType":"message","ruleFindings":[{"tactic":"threat_fear","text":"account will be BLOCKED"}]}'

call check-urls '{"urls":["http://kyc-update-sbi.in/verify","https://bit.ly/3xmpl","https://www.rbi.org.in"]}'

call fact-check '{"claims":[{"id":"c0","query":"500 rupee note banned next month","languageCodes":["en"]}]}'

call spar '{"personaId":"bank_kyc","language":"en","history":[{"role":"scammer","text":"Your account will be blocked within 24 hours because KYC is pending."},{"role":"user","text":"Which branch are you calling from?"}]}'

call debrief '{"personaId":"bank_kyc","language":"en","history":[{"role":"scammer","text":"Your account will be blocked within 24 hours."},{"role":"user","text":"This sounds like a scam, I will call the number on my card."}]}'

call xray "{\"imageBase64\":\"$PIXEL\",\"mimeType\":\"image/jpeg\",\"caption\":\"Off to Goa till Sunday\",\"language\":\"en\"}"

call ocr "{\"imageBase64\":\"$PIXEL\",\"mimeType\":\"image/jpeg\"}"

printf '\n=== CORS check (should refuse a foreign origin) ===\n'
curl -sS -m 20 -o /dev/null -D - "${AUTH[@]}" -H 'content-type: application/json' \
  -H 'origin: https://evil.example' -d '{"urls":[]}' "$BASE/check-urls" \
  | grep -i 'access-control-allow-origin' || echo '(no ACAO header returned)'
