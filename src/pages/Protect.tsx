/**
 * Post X-Ray. Metadata, caption rules, blurring and the clean copy all run on
 * the device. The photo only leaves it after an explicit consent, downscaled
 * and re-encoded so its metadata is already gone.
 *
 * known_facts live in memory and are cleared when this page unmounts.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, EvidenceBadge, Notice, Page, PageTitle, Spinner } from '../components/ui';
import { PillButton, PillLink } from '../components/Pill';
import { buildKnownFacts, NO_METADATA, type XrayFinding } from '../core/postXray';
import { localXray, remoteXray } from '../lib/protect';
import { blurRegions, cleanCopy, downloadBlob, MAX_UPLOAD_BYTES } from '../lib/image';
import { mapLink } from '../lib/exif';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';

export default function Protect() {
  const { lang, s } = useLanguage();
  const strings = t(lang);
  const navigate = useNavigate();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [findings, setFindings] = useState<XrayFinding[]>([]);
  const [strangerLearns, setStrangerLearns] = useState<string[]>([]);
  const [rewrite, setRewrite] = useState('');
  const [metaMissing, setMetaMissing] = useState(false);
  const [gps, setGps] = useState<{ lat: number; lon: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const [blurred, setBlurred] = useState<Set<string>>(new Set());
  const [blurPreview, setBlurPreview] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const visual = findings.filter((f) => f.kind === 'visual' && f.box);
  const known = useMemo(() => buildKnownFacts(findings, lang), [findings, lang]);

  async function onPick(picked: File) {
    setError(null);
    if (picked.size > MAX_UPLOAD_BYTES) {
      setError(strings.errors.imageTooLarge);
      return;
    }

    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    setFindings([]);
    setStrangerLearns([]);
    setRewrite('');
    setBlurPreview(null);
    setBlurred(new Set());
    setAiUnavailable(false);
  }

  async function runLocal() {
    if (!file) return;
    setBusy(lang === 'hi' ? 'आपके डिवाइस पर जाँचा जा रहा है…' : 'Checking on your device…');
    const local = await localXray(file, caption, lang);
    setFindings(local.findings);
    setMetaMissing(local.metadata.latitude === undefined);
    setGps(
      local.metadata.latitude !== undefined && local.metadata.longitude !== undefined
        ? { lat: local.metadata.latitude, lon: local.metadata.longitude }
        : null,
    );
    setBusy(null);
  }

  async function runVision() {
    if (!file) return;
    // eslint-disable-next-line no-alert
    if (!window.confirm(strings.protect.consentVision)) return;

    setBusy(lang === 'hi' ? 'फ़ोटो देखी जा रही है…' : 'Looking at the photo…');
    const remote = await remoteXray(file, caption, lang);
    setBusy(null);

    if (remote.unavailable) {
      setAiUnavailable(true);
      return;
    }
    setFindings((prev) => [...prev, ...remote.findings]);
    setStrangerLearns(remote.strangerLearns);
    setRewrite(remote.captionRewrite);
  }

  async function applyBlur() {
    if (!file) return;
    const boxes = visual
      .filter((f) => blurred.has(f.id))
      .map((f) => f.box!)
      .filter(Boolean);
    if (!boxes.length) return;

    setBusy(lang === 'hi' ? 'धुँधला किया जा रहा है…' : 'Blurring…');
    try {
      setBlurPreview(await blurRegions(file, boxes));
    } catch {
      setError(lang === 'hi' ? 'धुँधला नहीं कर सके।' : 'Could not blur that image.');
    }
    setBusy(null);
  }

  async function downloadClean() {
    if (!file) return;
    setBusy(lang === 'hi' ? 'साफ़ कॉपी बन रही है…' : 'Making a clean copy…');
    try {
      const blob = await cleanCopy(file);
      downloadBlob(blob, 'clean-photo.jpg');
    } catch {
      setError(lang === 'hi' ? 'कॉपी नहीं बना सके।' : 'Could not make a clean copy.');
    }
    setBusy(null);
  }

  return (
    <Page>
      <PageTitle sub={strings.protect.subtitle}>{strings.protect.title}</PageTitle>

      <Card className="space-y-5">
        <div className="flex flex-wrap gap-2">
          <PillButton tone="dark" dot onClick={() => fileRef.current?.click()}>
            {strings.protect.upload}
          </PillButton>
          <PillLink to="/protect/checkup" tone="light">
            {strings.protect.checkup}
          </PillLink>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) void onPick(picked);
            e.target.value = '';
          }}
        />

        <label className="block">
          <span className="mb-2 block text-[0.72rem] uppercase tracking-[0.18em] text-ink-mute">
            {strings.protect.caption}
          </span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 1000))}
            rows={3}
            className="w-full resize-y rounded-2xl bg-white/80 p-4 text-[1rem] outline-none"
          />
        </label>

        {preview ? (
          <div className="relative overflow-hidden rounded-media bg-night">
            <img
              src={blurPreview ?? preview}
              alt={s({
                en: 'The photo you uploaded, with any findings marked',
                hi: 'आपकी अपलोड की गई फ़ोटो, मिली बातों के निशान के साथ',
              })}
              className="w-full"
            />
            {!blurPreview &&
              visual.map((finding, i) => {
                const [ymin, xmin, ymax, xmax] = finding.box!;
                return (
                  <span
                    key={finding.id}
                    className="pointer-events-none absolute border-2 border-white"
                    style={{
                      top: `${ymin / 10}%`,
                      left: `${xmin / 10}%`,
                      height: `${(ymax - ymin) / 10}%`,
                      width: `${(xmax - xmin) / 10}%`,
                      boxShadow: '0 0 0 9999px rgba(0,0,0,0.08)',
                    }}
                  >
                    <span className="absolute -top-3 left-0 rounded-full bg-white px-2 text-xs font-semibold text-ink">
                      {i + 1}
                    </span>
                  </span>
                );
              })}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <PillButton tone="light" onClick={() => void runLocal()}>
            {strings.protect.runLocal}
          </PillButton>
          {file ? (
            <PillButton tone="light" onClick={() => void runVision()}>
              {s({ en: 'Look at the photo (sends it)', hi: 'फ़ोटो देखिए (भेजी जाएगी)' })}
            </PillButton>
          ) : null}
        </div>

        {busy ? <Spinner label={busy} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}
        {aiUnavailable ? <Notice tone="warn">{strings.check.aiUnavailable}</Notice> : null}
        {metaMissing && findings.length ? <Notice>{s(NO_METADATA)}</Notice> : null}

        {gps ? (
          <a
            className="inline-block text-sm underline underline-offset-4"
            href={mapLink(gps.lat, gps.lon)}
            target="_blank"
            rel="noreferrer noopener"
          >
            {s({ en: 'Open in map', hi: 'मैप में खोलिए' })} ({gps.lat.toFixed(3)}, {gps.lon.toFixed(3)})
          </a>
        ) : null}
      </Card>

      {findings.length ? (
        <>
          <ol className="mt-8 grid gap-3 md:grid-cols-2">
            {findings.map((finding, i) => (
              <li key={finding.id} className="rounded-2xl bg-white/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold capitalize">
                    {i + 1}. {finding.title}
                  </span>
                  <EvidenceBadge evidence={finding.evidence} />
                </div>
                <p className="mt-2 text-sm leading-[1.5] text-ink-soft">{finding.detail}</p>
                {finding.text ? (
                  <p className="mt-2 rounded-xl bg-canvas-soft px-3 py-2 text-sm italic">
                    “{finding.text}”
                  </p>
                ) : null}
                {finding.kind === 'visual' ? (
                  <label className="mt-3 flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={blurred.has(finding.id)}
                      onChange={(e) =>
                        setBlurred((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(finding.id);
                          else next.delete(finding.id);
                          return next;
                        })
                      }
                    />
                    {s({ en: 'Blur this area', hi: 'यह हिस्सा धुँधला कीजिए' })}
                  </label>
                ) : null}
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-2">
            <PillButton tone="light" onClick={() => void applyBlur()}>
              {strings.protect.blur}
            </PillButton>
            <PillButton tone="light" onClick={() => void downloadClean()}>
              {strings.protect.removeLocation}
            </PillButton>
            {rewrite ? (
              <PillButton
                tone="light"
                onClick={() => void navigator.clipboard?.writeText(rewrite)}
              >
                {strings.protect.saferCaption}
              </PillButton>
            ) : null}
          </div>

          {rewrite ? (
            <Card className="mt-6">
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-[0.14em]">
                {strings.protect.saferCaption}
              </h2>
              <p className="text-[1rem] leading-[1.5]">{rewrite}</p>
            </Card>
          ) : null}

          {strangerLearns.length ? (
            <Card className="mt-6">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em]">
                {strings.protect.strangerLearns}
              </h2>
              <ul className="space-y-2 text-[1rem] text-ink-soft">
                {strangerLearns.map((item, i) => (
                  <li key={i}>• {item}</li>
                ))}
              </ul>
            </Card>
          ) : null}

          {known.facts.length ? (
            <section className="mt-8 rounded-media bg-night p-6 text-white">
              <h2 className="display mb-3" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.4rem)' }}>
                {strings.protect.attackerView}
              </h2>
              <p className="mb-5 max-w-2xl text-sm leading-[1.5] text-white/70">
                {s({
                  en: 'Opt in and the simulated scammer is built from these facts only. They are cleared when you leave this page.',
                  hi: 'सहमति दीजिए और नकली ठग सिर्फ़ इन्हीं बातों से बनेगा। यह पेज छोड़ते ही ये मिट जाती हैं।',
                })}
              </p>
              <ul className="mb-6 space-y-2 text-sm">
                {known.facts.map((fact, i) => (
                  <li key={i} className="rounded-xl border border-white/15 px-4 py-2">
                    {fact}
                  </li>
                ))}
              </ul>
              <PillButton
                tone="ghost"
                dot
                onClick={() =>
                  navigate('/practise/personalised', {
                    state: { knownFacts: known.facts, factKinds: known.kinds },
                  })
                }
              >
                {strings.protect.attackerView}
              </PillButton>
            </section>
          ) : null}
        </>
      ) : null}
    </Page>
  );
}
