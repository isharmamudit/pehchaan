# Pehchaan

Mobile-first web app that helps people in India recognise scams, misleading forwards and
privacy leaks. Full stack: core logic, seven Supabase edge functions, and the interface.

```bash
npm install && npm run dev      # http://localhost:5173
```

## Screens

| Route | What it does |
|---|---|
| `/` | Landing page: preloader counter, scroll-drawn ribbons, live Check demo |
| `/check` | Paste text, a link, a screenshot, a QR or dictate a call; full result view |
| `/practise` | Persona picker, pressure profile and the adaptive "train your weak spot" round |
| `/practise/:personaId` | Sparring round, scorecard and debrief |
| `/practise/quiz/:set` | Spot-the-scam quiz A or B, with CSV export |
| `/protect` | Post X-Ray: metadata, caption rules, box overlays, blur, clean copy |
| `/protect/checkup` | Privacy Check-up and the k-anonymity breach check |
| `/help` | Get Help Now: five situations with ordered steps |
| `/how-it-works` | The nine tactics, the badges, the promises, the limits |
| `/demo` | Preloaded fictional inputs, and the entry to the guided run |
| `/demo/run` | Guided four-act demo: narration on screen, nothing typed on stage |
| `/lab` | Hidden evaluation bench over the fixtures |

The interface is built with React, Tailwind, GSAP and Lenis. Motion is opt-out: with
`prefers-reduced-motion` the preloader completes instantly, smooth scrolling never starts
and every reveal resolves immediately. Reveals use IntersectionObserver with a safety
timeout, so a section can never be left blank by a missed trigger.

## Principles enforced in code, not just copy

| Principle | Where it is enforced |
|---|---|
| Explain, don't judge | Every `Finding` carries a tactic, a span and a one-sentence explanation (`src/core/rules.ts`) |
| Evidence before AI | Rules run first on the original text; the AI only explains (`src/core/pipeline.ts`) |
| Badges set by code | `evidence` is assigned by origin in the pipeline; the AI never sets one |
| Never say "safe" | Only three verdicts, and `verdict.test.ts` fails if the copy claims safety |
| AI can't invent evidence | `verifyAiFindings` drops any quote that is not a verifiable substring (`src/core/verify.ts`) |
| Private by design | `redact()` masks before any network call; no storage, no accounts, no content in logs |

## Layout

```
src/core/        pure logic, no DOM, no network
  tactics.ts     the 9 tactics (ids, names, one-liners, examples) — single source of truth
  types.ts       Finding / Claim / UrlResult / AnalysisResult / Verdict
  contracts.ts   request+response shapes for every edge function
  redact.ts      privacy shield: phone, email, Aadhaar, PAN, card (Luhn), account, UPI, OTP
  rules.ts       deterministic rule engine, EN + Hinglish + Devanagari
  hoaxTemplates.ts  viral-forward shapes (currency, chain forward, shouting, …)
  urls.ts        URL + bare-domain extraction, shortener list
  verify.ts      AI quote verification (case- and whitespace-insensitive span finding)
  verdict.ts     verdict computed in code; AI opinion ignored
  claims.ts      fact-check rating → label, official-source routing
  pipeline.ts    the whole Check flow, including merge + badge assignment
  levers.ts      pressure levers (fear/authority/greed/urgency/trust) and the
                 pressure profile behind Adaptive Sparring
  timeline.ts    "what happens if you reply", built from the tactics found
  personas.ts    4 sparring personas with fully scripted fallback dialogue
  sparring.ts    intent detection, turn tagging, scoring rubric, session state
  debrief.ts     static per-persona debriefs (used when the AI debrief fails)
  postXray.ts    photo metadata findings, caption rules, known-facts builder
  checkup.ts     12-question privacy check-up + prioritised fix list
  detect.ts      input-type auto-detection
  lab.ts         /lab evaluation bench over the fixtures

src/lib/         browser-side device and service layer
  api.ts         edge-function client (no API keys ever reach the browser)
  image.ts       downscale/re-encode (strips EXIF), region blur, clean copy
  exif.ts        exifr wrapper
  qr.ts          jsQR decode + upi://pay parsing
  speech.ts      Web Speech API wrapper
  ocr.ts         screenshot → text
  protect.ts     Post X-Ray local pass + consented vision pass
  practise.ts    spar / debrief clients with automatic fallback
  shareCard.ts   PNG card (verdict + counts + tactic names only)
  pwned.ts       k-anonymity breached-password check
  storage.ts     try/catch-wrapped localStorage (scores, quiz, language only)

src/components/  Pill, SiteNav, Preloader, Ribbon, HeroCheckCard, TacticsMarquee,
                 ui.tsx (Page/Card/EvidenceBadge/VerdictBand/Notice), check/*
src/pages/       Landing, Check, Practise, Spar, Quiz, Protect, Checkup, Help,
                 HowItWorks, Demo, Lab
src/config/      help.ts (helplines, 5 situations), officialSources.ts (verify-in-60s),
                 doNow.ts (next steps per verdict and input type)
src/data/        quiz.ts (10 original before/after items)
src/demo/        inputs.ts (5 demo inputs), cache/ (recorded results), record.test.ts
src/i18n/        en.ts, hi.ts
src/test/        138 tests + fixtures (messages, claims, redaction)

supabase/functions/
  _shared/       http (CORS, logging), rateLimit, validate, gemini, schema, prompts,
                 officialDomains, lookalike, netGuard (SSRF), safeBrowsing, personaConfig
  analyze/       Gemini explanation + claim extraction (JSON schema, temp 0.2)
  check-urls/    redirect expansion + lookalike + Safe Browsing (batched)
  fact-check/    Fact Check Tools API, plus P1 grounded-source links
  spar/          one scammer turn (falls back to the client's script)
  debrief/       coaching summary, quotes verified against the transcript
  xray/          Post X-Ray vision pass, caption quotes verified
  ocr/           screenshot text extraction
```

## Setup

```bash
npm install
cp .env.example .env.local   # fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm test                     # 137 unit tests, no network needed
```

### Secrets (server only)

```bash
supabase secrets set GEMINI_API_KEY=... GEMINI_MODEL=<current gemini flash model> GOOGLE_API_KEY=...
supabase secrets set ALLOWED_ORIGIN=https://your-app-host
```

`GOOGLE_API_KEY` is one Google Cloud key with **Safe Browsing API** and **Fact Check Tools API**
both enabled. `GEMINI_MODEL` is read at runtime and is not hardcoded anywhere.

### Deploy the functions

```bash
supabase functions deploy analyze check-urls fact-check spar debrief xray ocr
```

All seven are configured with `verify_jwt = false` in `supabase/config.toml` and are
protected by CORS (`ALLOWED_ORIGIN`), input validation and a per-IP rate limit
(30 requests / 10 minutes; 15 for `xray`, 20 for `ocr`).

## What runs where

| Step | Where | Leaves the device? |
|---|---|---|
| Rule engine, hoax templates, verdict | Browser | No |
| Privacy shield (redaction) | Browser | No |
| Photo metadata, caption rules, blur, clean copy | Browser | No |
| QR decoding, breached-password hashing | Browser | Only a 5-character hash prefix |
| URL list → `check-urls` | Server | The URLs only, never the message |
| Redacted text → `analyze` | Server → Gemini | Tokenised text only |
| Downscaled photo → `xray` / `ocr` | Server → Gemini | Re-encoded image, no EXIF |

Nothing is stored anywhere. Function logs record the function name, status and duration only.

## Demo mode

`src/demo/inputs.ts` holds five original, fictional inputs. Cached results in
`src/demo/cache/` were produced by running the real pipeline:

```bash
npm run record-demo     # re-record with whatever keys are configured
```

Each file records `source: "live"` or `source: "offline_rules_only"`. The current files are
`offline_rules_only` (recorded with no API keys present, so they contain rule findings only).
**Re-run `npm run record-demo` once the secrets are set** to capture live results including
link checks and AI explanations. A cached result must always be shown with the
"offline demo result" label (`CACHED_LABEL`).

Recorded verdicts today, from rules alone: KYC SMS `likely_scam` (6 findings),
digital-arrest transcript `likely_scam` (9), currency hoax `likely_scam` (11),
UPI pay QR `likely_scam` (1).

## Verifying without deploying

```bash
npm test                   # 141 unit tests
npm run bench              # the /lab fixtures through the real pipeline
deno check supabase/functions/*/index.ts
./scripts/local-test.sh    # runs each function under plain Deno (no Docker)
./scripts/smoke.sh         # the same checks against your deployed project
```

`local-test.sh` with no env file verifies the keys-removed behaviour: every AI function
returns an honest `ai_unavailable` / `fallback_required`, `check-urls` still expands and
checks domains, oversized and malformed input is rejected, and SSRF targets
(`127.0.0.1`, `169.254.169.254`, `file://`) are refused.

## Evaluation

`src/core/lab.ts` runs the real pipeline over `src/test/fixtures/` and reports scams flagged,
false positives, redaction pass rate and per-item timings, with CSV export. With rules only
(no network) it currently flags 12/12 scam fixtures and 0/7 legitimate ones.

## The guided demo

`/demo/run` is the three-and-a-half minute path for a live audience. Four acts, one Next
button (or arrow keys), and no typing on stage:

1. **The message** — the KYC SMS through the real pipeline: verdict, inline flags, tactic
   names, evidence badges and the "what happens if you reply" timeline.
2. **What actually left the device** — the original text beside the exact JSON payload the
   server receives, with every `[PHONE_1]`-style token highlighted. Built by the same
   `buildAnalyzeRequest` the pipeline uses, so it proves the shield rather than illustrating it.
3. **The photo** — the sample post through Post X-Ray, ending in the facts a stranger now
   knows: the child's school, and that the house is empty until Sunday.
4. **The scammer built from that photo** — a personalised round whose persona is chosen
   from act three's facts, driven by three scripted replies. The last one gives something
   away on purpose, so the act ends on the scorecard and the pressure profile.

Every act runs the real product. When a service is missing the act says so — act three
states plainly that photo reading is unavailable and that everything shown was found on
the device. `src/test/demoData.test.ts` asserts the sample message still contains maskable
values, so act two can never quietly become a slide that proves nothing.

## Adaptive Sparring

Each of the nine tactics maps to one of five psychological levers: **fear, authority,
greed, urgency, trust**. After every round the app records which levers were used against
the person and whether they gave anything up while under them. That builds a pressure
profile — "You resist greed, but you fold under authority" — and the next round is
started with the persona that leans hardest on their weakest lever, with `targetLever`
passed through to the simulation prompt.

Folding means `shared_info`: questioning, refusing, verifying and leaving do not count.
The profile is stored on the device only, and `src/test/levers.test.ts` covers the
mapping, the fold rule, the weak-spot choice and the persona selection.

## Payload

The landing page loads ~117 KB of gzipped JavaScript. jsQR, exifr and html-to-image are
dynamic imports, and every route except the landing page is code-split, so the QR decoder
and the EXIF parser are only fetched when a photo is actually handled.

## Not built yet

- The UPI demo input ships as the **decoded payload** rather than a QR image file; the live
  QR path (`src/lib/qr.ts`) works with any uploaded QR photo. A sample QR PNG needs a QR
  encoder, which is not in the approved dependency list.
- Lighthouse has not been run. The markup is semantic, controls are labelled, focus is
  visible and tap targets are 44px, but the score itself is unverified.
- `src/demo/record.test.ts` is excluded from `tsc` because it uses `node:fs`
  and `@types/node` is not an approved dependency. It runs fine under Vitest.
- Nothing is deployed yet: that needs the Gemini key, the Google Cloud key and a
  Supabase project. See [SETUP.md](SETUP.md).
