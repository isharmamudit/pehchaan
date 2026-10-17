/**
 * Known viral-forward shapes. These are structural hoax patterns, not claims
 * about truth — they say "this message is built like a hoax", nothing more.
 */

import type { Finding } from './types';
import type { Lang, Localised, TacticId } from './tactics';
import { dedupeFindings } from './rules';

export type HoaxTopic =
  | 'currency'
  | 'chain_forward'
  | 'fake_global_body'
  | 'freebie'
  | 'conspiracy'
  | 'deletion_urgency'
  | 'shouting';

export interface HoaxTemplate {
  id: string;
  topic: HoaxTopic;
  tactic: TacticId;
  pattern: RegExp;
  weight: number;
  explanation: Localised;
}

export const HOAX_TEMPLATES: HoaxTemplate[] = [
  {
    id: 'hoax_currency_invalid',
    topic: 'currency',
    tactic: 'false_urgency',
    pattern:
      /\b(note|notes|currency|coins?|₹\s?\d+\s*(note|rupee)s?|\d+\s*(rupee|rs)\.?\s*notes?)\b[\s\S]{0,60}?\b(invalid|banned|ban|illegal|not valid|discontinued|withdrawn|band|bandh)\b/gi,
    weight: 2,
    explanation: {
      en: 'Currency rules change only through an RBI notification, never through a forward.',
      hi: 'नोट से जुड़े नियम सिर्फ़ आरबीआई की अधिसूचना से बदलते हैं, किसी फ़ॉरवर्ड से नहीं।',
    },
  },
  {
    id: 'hoax_currency_hi',
    topic: 'currency',
    tactic: 'false_urgency',
    pattern: /(नोट|नोटों|मुद्रा)[\s\S]{0,40}?(बंद|अमान्य|रद्द|नहीं चलेंगे|नहीं चलेगा)/g,
    weight: 2,
    explanation: {
      en: 'Currency rules change only through an RBI notification, never through a forward.',
      hi: 'नोट से जुड़े नियम सिर्फ़ आरबीआई की अधिसूचना से बदलते हैं, किसी फ़ॉरवर्ड से नहीं।',
    },
  },
  {
    id: 'hoax_chain_forward',
    topic: 'chain_forward',
    tactic: 'secrecy_isolation',
    pattern:
      /\b(forward|share|send)\s+(this\s+)?(message\s+)?to\s+(\d+|every|all|as many)\s*(groups?|people|contacts?|friends?)?\b/gi,
    weight: 2,
    explanation: {
      en: 'Genuine information never needs you to forward it to a set number of groups.',
      hi: 'सच्ची जानकारी को गिनती के ग्रुप में फ़ॉरवर्ड करने की ज़रूरत कभी नहीं पड़ती।',
    },
  },
  {
    id: 'hoax_chain_forward_hi',
    topic: 'chain_forward',
    tactic: 'secrecy_isolation',
    pattern: /(ज़्यादा से ज़्यादा|अधिक से अधिक|सभी ग्रुप में|सबको)[\s\S]{0,20}?(भेज|शेयर|फॉरवर्ड|फ़ॉरवर्ड)/g,
    weight: 2,
    explanation: {
      en: 'Genuine information never needs you to forward it to a set number of groups.',
      hi: 'सच्ची जानकारी को गिनती के ग्रुप में फ़ॉरवर्ड करने की ज़रूरत कभी नहीं पड़ती।',
    },
  },
  {
    id: 'hoax_global_body',
    topic: 'fake_global_body',
    tactic: 'false_urgency',
    pattern: /\b(WHO|UNICEF|UNESCO|NASA|UN)\b\s+(says?|warns?|confirms?|announced?|declared?)\b/g,
    weight: 2,
    explanation: {
      en: 'These bodies publish on their own websites. A forward is not their announcement.',
      hi: 'ये संस्थाएँ अपनी वेबसाइट पर ही घोषणा करती हैं। फ़ॉरवर्ड उनकी घोषणा नहीं है।',
    },
  },
  {
    id: 'hoax_freebie',
    topic: 'freebie',
    tactic: 'false_urgency',
    pattern:
      /\bfree\s+(recharge|data|laptop|scooty|scooter|cylinder|sewing machine|ration|internet)\b/gi,
    weight: 2,
    explanation: {
      en: 'Government schemes are not announced through WhatsApp links.',
      hi: 'सरकारी योजनाओं की घोषणा व्हाट्सऐप लिंक से नहीं होती।',
    },
  },
  {
    id: 'hoax_conspiracy',
    topic: 'conspiracy',
    tactic: 'false_urgency',
    pattern:
      /\b(government|govt|media|doctors)\s+(is\s+|are\s+)?(hiding|won'?t tell|will not tell|suppress(ing)?|don'?t want you to know)\b/gi,
    weight: 1,
    explanation: {
      en: '"They are hiding this" is used to make you trust a forward over official sources.',
      hi: '"वे छिपा रहे हैं" कहकर आपको आधिकारिक स्रोत की जगह फ़ॉरवर्ड पर भरोसा कराया जाता है।',
    },
  },
  {
    id: 'hoax_deletion_urgency',
    topic: 'deletion_urgency',
    tactic: 'false_urgency',
    pattern:
      /\b(will be )?delete(d)?\s+(soon|before|within)|share before (it'?s )?(deleted|removed|taken down)|forward before (it'?s )?(deleted|removed)\b/gi,
    weight: 2,
    explanation: {
      en: '"Share before it is deleted" exists to stop you from checking first.',
      hi: '"हटने से पहले शेयर करें" इसलिए लिखा जाता है ताकि आप पहले जाँच न करें।',
    },
  },
];

const CAPS_RUN = /[A-Z][A-Z\s]{14,}[A-Z]/g;
const SHOUT_MARKS = /(!{3,}|(?:⚠️\s*){3,}|(?:🚨\s*){3,})/g;

function shoutingFindings(text: string, lang: Lang): Finding[] {
  const out: Finding[] = [];
  const explanation: Localised = {
    en: 'Shouting and alarm symbols are used to make a forward feel official and urgent.',
    hi: 'बड़े अक्षर और चेतावनी के निशान फ़ॉरवर्ड को सरकारी और ज़रूरी दिखाने के लिए होते हैं।',
  };

  const letters = text.replace(/[^A-Za-z]/g, '');
  if (letters.length >= 40) {
    const upper = text.replace(/[^A-Z]/g, '').length;
    if (upper / letters.length > 0.5) {
      const runs = [...text.matchAll(CAPS_RUN)].sort((a, b) => b[0].length - a[0].length);
      const run = runs[0];
      if (run) {
        const start = run.index ?? 0;
        out.push({
          id: `hoax_all_caps@${start}`,
          tactic: 'false_urgency',
          matchedText: run[0],
          start,
          end: start + run[0].length,
          evidence: 'rule',
          explanation: explanation[lang],
          weight: 1,
          ruleId: 'hoax_all_caps',
          hoaxTemplate: true,
        });
      }
    }
  }

  for (const m of text.matchAll(SHOUT_MARKS)) {
    const start = m.index ?? 0;
    out.push({
      id: `hoax_shout_marks@${start}`,
      tactic: 'false_urgency',
      matchedText: m[0],
      start,
      end: start + m[0].length,
      evidence: 'rule',
      explanation: explanation[lang],
      weight: 1,
      ruleId: 'hoax_shout_marks',
      hoaxTemplate: true,
    });
  }

  return out;
}

export function runHoaxTemplates(text: string, lang: Lang = 'en'): Finding[] {
  const findings: Finding[] = [];
  for (const t of HOAX_TEMPLATES) {
    const re = new RegExp(t.pattern.source, t.pattern.flags.includes('g')
      ? t.pattern.flags
      : `${t.pattern.flags}g`);
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      findings.push({
        id: `${t.id}@${start}`,
        tactic: t.tactic,
        matchedText: m[0],
        start,
        end: start + m[0].length,
        evidence: 'rule',
        explanation: t.explanation[lang],
        weight: t.weight,
        ruleId: t.id,
        hoaxTemplate: true,
      });
    }
  }
  findings.push(...shoutingFindings(text, lang));
  return dedupeFindings(findings);
}

export function hoaxTopics(findings: Finding[]): HoaxTopic[] {
  const byId = new Map(HOAX_TEMPLATES.map((t) => [t.id, t.topic]));
  const topics = new Set<HoaxTopic>();
  for (const f of findings) {
    if (!f.ruleId) continue;
    const topic = byId.get(f.ruleId);
    if (topic) topics.add(topic);
    else if (f.ruleId.startsWith('hoax_')) topics.add('shouting');
  }
  return [...topics];
}
