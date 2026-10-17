/**
 * Check: paste a message, a link, a screenshot, a QR or describe a call.
 *
 * Order of work, enforced by the pipeline: rules run locally on the original
 * text, personal details are masked in the browser, and only then does
 * anything reach the network. The verdict is computed in code.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, Notice, Page, PageTitle, Spinner } from '../components/ui';
import { cachedDemo } from '../demo/cache';
import PrivacyChip from '../components/check/PrivacyChip';
import ResultView from '../components/check/ResultView';
import { analyzeInput, MAX_TEXT_LENGTH } from '../core/pipeline';
import { redact } from '../core/redact';
import { detectInputType } from '../core/detect';
import { decodeQr, UPI_PAY_WARNING } from '../lib/qr';
import { readScreenshot, SCREENSHOT_CONSENT } from '../lib/ocr';
import { speechSupported, startDictation, type SpeechSession } from '../lib/speech';
import { MAX_UPLOAD_BYTES } from '../lib/image';
import { markNoticeSeen, noticeSeen } from '../lib/storage';
import { useLanguage } from '../lib/language';
import { t } from '../i18n';
import { demoInput } from '../demo/inputs';
import type { AnalysisResult, Finding, InputType } from '../core/types';

type Stage = 'input' | 'working' | 'result';

export default function Check() {
  const { lang, s } = useLanguage();
  const strings = t(lang);
  const [params] = useSearchParams();

  const [text, setText] = useState('');
  const [override, setOverride] = useState<InputType | null>(null);
  const [stage, setStage] = useState<Stage>('input');
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upiPayQr, setUpiPayQr] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyNote, setBusyNote] = useState<string | null>(null);
  const [cachedLabel, setCachedLabel] = useState(false);

  const sessionRef = useRef<SpeechSession | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const detected = override ?? detectInputType(text);
  // What the shield would mask if the user pressed Check right now.
  const liveCounts = useMemo(() => redact(text).counts, [text]);

  /* ------------------------------------------------------------ demo prefill */
  useEffect(() => {
    const id = params.get('demo');
    if (!id) return;
    const demo = demoInput(id);
    if (!demo) return;
    setText(demo.text);
    setOverride(demo.inputType);
    setUpiPayQr(demo.inputType === 'qr');
  }, [params]);

  /* ---------------------------------------------------------------- analyse */
  const analyse = useCallback(
    async (value: string, type: InputType, isUpiQr: boolean) => {
      const trimmed = value.trim();
      if (!trimmed) return;

      setStage('working');
      setError(null);
      setCachedLabel(false);

      const extraFindings: Finding[] = isUpiQr
        ? [
            {
              id: 'qr_upi_pay',
              tactic: 'payment_request',
              matchedText: trimmed.slice(0, 80),
              start: -1,
              end: -1,
              evidence: 'rule',
              explanation: s(UPI_PAY_WARNING),
              weight: 3,
            },
          ]
        : [];

      try {
        const analysis = await analyzeInput({
          text: trimmed,
          inputType: type,
          lang,
          upiPayQr: isUpiQr,
          extraFindings,
        });
        setResult(analysis);
        setStage('result');
      } catch {
        // Last resort: a recorded demo result, always labelled as such.
        const id = params.get('demo');
        const cached = id ? cachedDemo(id) : undefined;
        if (cached) {
          setResult(cached.result);
          setCachedLabel(true);
          setStage('result');
        } else {
          setError(strings.errors.network);
          setStage('input');
        }
      }
    },
    [lang, params, s, strings.errors.network],
  );

  /* ------------------------------------------------------------------ voice */
  function toggleVoice() {
    if (listening) {
      sessionRef.current?.stop();
      return;
    }
    if (!noticeSeen('voice')) {
      // eslint-disable-next-line no-alert
      const ok = window.confirm(strings.errors.voiceNotice);
      if (!ok) return;
      markNoticeSeen('voice');
    }

    const session = startDictation(lang === 'hi' ? 'hi-IN' : 'en-IN', {
      onInterim: setInterim,
      onFinal: (final) => {
        if (final) {
          setText(final);
          setOverride('voice_transcript');
        }
        setInterim('');
        setListening(false);
      },
      onError: () => {
        setInterim('');
        setListening(false);
      },
    });

    if (!session) {
      setError(strings.errors.voiceUnsupported);
      return;
    }
    sessionRef.current = session;
    setListening(true);
  }

  /* ------------------------------------------------------------------ image */
  async function onFile(file: File) {
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(strings.errors.imageTooLarge);
      return;
    }

    setBusyNote(lang === 'hi' ? 'क्यूआर खोजा जा रहा है…' : 'Looking for a QR code…');
    try {
      const qr = await decodeQr(file);
      if (qr) {
        setBusyNote(null);
        setText(qr.raw);
        setOverride(qr.kind === 'upi_pay' ? 'qr' : qr.kind === 'url' ? 'url' : 'message');
        setUpiPayQr(qr.kind === 'upi_pay');
        return;
      }
    } catch {
      /* not a QR image; fall through to reading the text */
    }

    setBusyNote(null);
    // eslint-disable-next-line no-alert
    if (!window.confirm(s(SCREENSHOT_CONSENT))) return;

    setBusyNote(lang === 'hi' ? 'स्क्रीनशॉट पढ़ा जा रहा है…' : 'Reading the screenshot…');
    const ocr = await readScreenshot(file);
    setBusyNote(null);

    if (!ocr.ok) {
      setError(
        ocr.reason === 'empty'
          ? lang === 'hi'
            ? 'इस तस्वीर में कोई टेक्स्ट नहीं मिला।'
            : 'No text was found in that image.'
          : strings.errors.noBackend,
      );
      return;
    }

    setText(ocr.text);
    setOverride('screenshot');
  }

  /* ----------------------------------------------------------------- render */
  const counts = useMemo(() => {
    if (!result) return '';
    const rules = result.findings.filter((f) => f.evidence === 'rule').length;
    return `${strings.check.redFlags(result.findings.length)} · ${strings.check.ruleMatches(rules)}`;
  }, [result, strings.check]);

  if (stage === 'result' && result) {
    return (
      <Page>
        <ResultView
          result={result}
          counts={counts}
          cached={cachedLabel}
          activeId={activeId}
          onSelect={setActiveId}
          onReset={() => {
            setResult(null);
            setStage('input');
            setText('');
            setOverride(null);
            setUpiPayQr(false);
          }}
        />
      </Page>
    );
  }

  return (
    <Page>
      <PageTitle sub={strings.check.placeholder}>{strings.check.title}</PageTitle>

      <Card className="space-y-4">
        <div className="relative">
          <textarea
            value={listening && interim ? interim : text}
            onChange={(e) => {
              setText(e.target.value.slice(0, MAX_TEXT_LENGTH));
              setUpiPayQr(false);
            }}
            rows={5}
            maxLength={MAX_TEXT_LENGTH}
            aria-label={strings.check.placeholder}
            placeholder={strings.check.placeholder}
            className="w-full resize-none rounded-2xl bg-white p-4 text-[1rem] leading-[1.6] outline-none placeholder:text-ink-mute border border-line/15 focus:border-indigo transition-colors break-words [overflow-wrap:anywhere]"
          />
          {!text && (
            <button
              type="button"
              onClick={async () => {
                try {
                  const clip = await navigator.clipboard.readText();
                  if (clip) {
                    setText(clip.slice(0, MAX_TEXT_LENGTH));
                    setUpiPayQr(false);
                  }
                } catch {
                  /* clipboard permission not available */
                }
              }}
              className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-xl bg-canvas-soft px-3 py-1.5 text-xs font-semibold text-ink-soft shadow-sm hover:bg-canvas transition-colors active:scale-95"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span>{s({ en: 'Paste', hi: 'पेस्ट करें' })}</span>
            </button>
          )}
        </div>

        <PrivacyChip counts={liveCounts} />

        {text.length > 0 ? (
          <p className="text-xs text-ink-mute">
            {text.length} / {MAX_TEXT_LENGTH}
          </p>
        ) : null}

        {busyNote ? <Spinner label={busyNote} /> : null}
        {error ? <Notice tone="error">{error}</Notice> : null}

        <div className="space-y-2.5 pt-1">
          <button
            type="button"
            disabled={!text.trim() || stage === 'working'}
            onClick={() => analyse(text, detected, upiPayQr)}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-6 py-4 text-base font-bold text-white shadow-md transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink-soft"
          >
            <span>{strings.check.analyse}</span>
            <span aria-hidden className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
          </button>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl bg-canvas-soft px-3 py-3 text-xs sm:text-sm font-semibold text-ink transition-transform active:scale-95 hover:bg-white"
            >
              <span>📷</span>
              <span>{strings.check.uploadImage}</span>
            </button>

            {speechSupported() ? (
              <button
                type="button"
                onClick={toggleVoice}
                className={`inline-flex items-center justify-center gap-1.5 rounded-2xl px-3 py-3 text-xs sm:text-sm font-semibold transition-transform active:scale-95 ${
                  listening ? 'bg-danger text-white' : 'bg-canvas-soft text-ink hover:bg-white'
                }`}
              >
                <span>🎙️</span>
                <span>{listening ? strings.check.stop : strings.check.speak}</span>
              </button>
            ) : null}

            <Link
              to="/demo"
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 rounded-2xl bg-canvas-soft px-3 py-3 text-xs sm:text-sm font-semibold text-ink transition-transform active:scale-95 hover:bg-white"
            >
              <span>✨</span>
              <span>{s({ en: 'Try Demo Inputs', hi: 'डेमो इनपुट' })}</span>
            </Link>
          </div>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onFile(file);
            e.target.value = '';
          }}
        />

        {!speechSupported() ? (
          <p className="text-xs text-ink-mute">{strings.errors.voiceUnsupported}</p>
        ) : null}
      </Card>

      {stage === 'working' ? (
        <div className="mt-6">
          <Spinner label={lang === 'hi' ? 'जाँचा जा रहा है…' : 'Checking…'} />
        </div>
      ) : null}
    </Page>
  );
}
