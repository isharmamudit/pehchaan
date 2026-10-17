# Setup: keys, project, deploy

Three things only you can do (they need your accounts). Everything after that I can run.

**Never paste a key into the chat.** Put the values in `supabase/.env.secrets` (gitignored,
already created as a template). I will push them to Supabase without reading them.

---

## 1. Gemini API key — 2 minutes

1. Open <https://aistudio.google.com/apikey>
2. **Create API key** → pick or create a Google Cloud project
3. Copy the key (starts `AIza…`) into `GEMINI_API_KEY` in `supabase/.env.secrets`

`GEMINI_MODEL` is already set to `gemini-3.8-flash`, the current Flash model
(previous generation: `gemini-3.6-flash`). Nothing in the code hardcodes it.

## 2. Google Cloud key for Safe Browsing + Fact Check — 5 minutes

Use the **same Cloud project** as above so one key can serve both.

1. Open <https://console.cloud.google.com/apis/library> and select that project
2. Enable **Safe Browsing API** → <https://console.cloud.google.com/apis/library/safebrowsing.googleapis.com>
3. Enable **Fact Check Tools API** → <https://console.cloud.google.com/apis/library/factchecktools.googleapis.com>
4. **APIs & Services → Credentials → Create credentials → API key**
5. Copy it into `GOOGLE_API_KEY` in `supabase/.env.secrets`

   (The Gemini key from step 1 can be reused here *if* you enable both APIs on it.
   A separate key is cleaner and lets you restrict it to these two APIs.)

## 3. Supabase project — 3 minutes

1. Sign in at <https://supabase.com/dashboard>
2. **New project** → name it `pehchaan`, region **South Asia (Mumbai)** for lowest latency
3. Wait for it to finish provisioning
4. From **Project Settings → API**, copy:
   - **Project URL** → `VITE_SUPABASE_URL` in `.env.local`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY` in `.env.local`

   These two are *public* by design: they are meant to be in the browser bundle.
   No secret ever goes in a `VITE_` variable.

5. In your terminal, log in to the CLI (it opens a browser):

   ```bash
   npx -y supabase login
   ```

Then tell me the project ref (the subdomain in your project URL, e.g. `abcdefghijklm`)
and I will link, deploy and smoke-test everything.

---

## What I run after that

```bash
npx supabase link --project-ref <ref>
npx supabase secrets set --env-file supabase/.env.secrets
npx supabase functions deploy analyze check-urls fact-check spar debrief xray ocr
npm run record-demo        # re-records the demo cache from the live pipeline
```

## Costs

- Supabase free tier covers this comfortably (edge functions, no database rows).
- Gemini Flash has a free tier with rate limits; a demo run is a handful of calls.
- Safe Browsing and Fact Check Tools are free at this volume.
