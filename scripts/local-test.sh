#!/usr/bin/env bash
# Runs each edge function under plain Deno (no Docker) and checks its behaviour.
# Pass an env file as $1 to supply keys; with none, this verifies the no-keys paths.
set -uo pipefail
cd "$(dirname "$0")/.."
ENVFILE="${1:-}"
PORT=8000   # Deno.serve default

run_one() {
  local name="$1" body="$2" label="$3"
  local args=(run --quiet --allow-net --allow-env)
  [ -n "$ENVFILE" ] && args+=(--env-file="$ENVFILE")
  deno "${args[@]}" "supabase/functions/$name/index.ts" >/tmp/sys-$name.log 2>&1 &
  local pid=$!
  for _ in $(seq 1 30); do
    curl -s -o /dev/null -m 1 "http://127.0.0.1:$PORT/" -X OPTIONS && break
    sleep 0.3
  done
  local out status
  out=$(curl -sS -m 30 -w '\n%{http_code}' -H 'content-type: application/json' \
        -H 'origin: http://localhost:5173' -d "$body" "http://127.0.0.1:$PORT/" 2>&1)
  status=$(printf '%s' "$out" | tail -1)
  printf '%-12s %-26s [HTTP %s] %s\n' "$name" "$label" "$status" "$(printf '%s' "$out" | sed '$d' | head -c 220)"
  kill "$pid" 2>/dev/null
  wait "$pid" 2>/dev/null
}

# A real 64x64 PNG, generated here so the test image is always valid.
PIXEL=$(python3 - <<'PYEOF'
import zlib, struct, base64
w = h = 64
row = bytes([40, 60, 200] * w)
raw = b''.join(b'\x00' + row for _ in range(h))
def chunk(tag, data):
    body = tag + data
    return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xffffffff)
png = (b'\x89PNG\r\n\x1a\n'
       + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0))
       + chunk(b'IDAT', zlib.compress(raw))
       + chunk(b'IEND', b''))
print(base64.b64encode(png).decode())
PYEOF
)

echo "=== valid requests ==="
run_one analyze '{"text":"Your account will be BLOCKED within 24 hrs. Share the OTP.","language":"en","inputType":"message","ruleFindings":[]}' "no key -> honest"
run_one fact-check '{"claims":[{"id":"c0","query":"500 rupee note banned","languageCodes":["en"]}]}' "no key -> unavailable"
run_one spar '{"personaId":"bank_kyc","language":"en","history":[{"role":"scammer","text":"hello"}]}' "no key -> fallback"
run_one debrief '{"personaId":"bank_kyc","language":"en","history":[{"role":"scammer","text":"hello"}]}' "no key -> fallback"
run_one xray "{\"imageBase64\":\"$PIXEL\",\"mimeType\":\"image/png\",\"caption\":\"hi\",\"language\":\"en\"}" "no key -> honest"
run_one ocr "{\"imageBase64\":\"$PIXEL\",\"mimeType\":\"image/png\"}" "no key -> honest"
run_one check-urls '{"urls":["https://www.rbi.org.in","http://kyc-update-sbi.in/verify"]}' "runs without a key"

echo
echo "=== rejected requests ==="
run_one analyze '{}' "missing text -> 400"
run_one analyze "{\"text\":\"$(head -c 6000 < /dev/zero | tr '\0' 'a')\",\"language\":\"en\",\"inputType\":\"message\"}" "6000 chars -> 400"
run_one spar '{"personaId":"not_a_persona","language":"en","history":[{"role":"scammer","text":"x"}]}' "bad persona -> 400"
run_one check-urls '{"urls":["http://127.0.0.1:8080/admin"]}' "SSRF target blocked"
run_one check-urls '{"urls":["file:///etc/passwd"]}' "bad scheme blocked"
