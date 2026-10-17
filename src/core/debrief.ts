/** Static per-persona debriefs, used whenever the AI debrief is unavailable. */

import { PERSONAS, type PersonaId } from './personas';
import { runRules } from './rules';
import type { DebriefResponse, SparMessage } from './contracts';
import type { Lang, TacticId } from './tactics';
import { TACTICS } from './tactics';

interface StaticDebrief {
  did_well: Record<Lang, string[]>;
  improve: Record<Lang, Array<{ moment: string; safer_response: string }>>;
}

const STATIC: Record<PersonaId, StaticDebrief> = {
  digital_arrest: {
    did_well: {
      en: [
        'You stayed in a training round instead of a real call — that is the right instinct to build.',
        'Every question you asked slowed the caller down, which is exactly what breaks this script.',
      ],
      hi: [
        'आपने असली कॉल की जगह अभ्यास चुना — यही सही आदत है।',
        'आपके हर सवाल ने कॉल करने वाले को धीमा किया, और यही इस स्क्रिप्ट को तोड़ता है।',
      ],
    },
    improve: {
      en: [
        {
          moment: 'When the caller said a warrant was being prepared',
          safer_response: 'No agency announces a warrant by phone. Hang up and call 1930 yourself.',
        },
        {
          moment: 'When told to stay on video call and tell nobody',
          safer_response: 'Say "I will speak to my family first" and disconnect. Secrecy is the tell.',
        },
      ],
      hi: [
        {
          moment: 'जब कहा गया कि वारंट तैयार हो रहा है',
          safer_response: 'कोई एजेंसी फ़ोन पर वारंट की सूचना नहीं देती। कॉल काटिए और ख़ुद 1930 पर कॉल कीजिए।',
        },
        {
          moment: 'जब वीडियो कॉल पर बने रहने और किसी को न बताने को कहा गया',
          safer_response: '"पहले परिवार से बात करूँगा" कहकर कॉल काट दीजिए। गोपनीयता ही पहचान है।',
        },
      ],
    },
  },
  bank_kyc: {
    did_well: {
      en: [
        'You treated an incoming "bank" call as unproven, which is the safest default.',
        'Asking for details the caller should already know is a good test.',
      ],
      hi: [
        'आपने आई हुई "बैंक" कॉल को बिना सबूत माना — यही सबसे सुरक्षित आदत है।',
        'ऐसी जानकारी पूछना जो कॉलर को पहले से पता होनी चाहिए, अच्छी परख है।',
      ],
    },
    improve: {
      en: [
        {
          moment: 'When asked to install a screen-sharing app',
          safer_response: 'Never install an app someone on a call asks for. It shows them your OTPs.',
        },
        {
          moment: 'When asked to read out the code',
          safer_response: 'Say "my bank never asks for an OTP" and call the number printed on your card.',
        },
      ],
      hi: [
        {
          moment: 'जब स्क्रीन शेयर ऐप इंस्टॉल करने को कहा गया',
          safer_response: 'कॉल पर कहे गए ऐप कभी इंस्टॉल न करें। इससे उन्हें आपके ओटीपी दिख जाते हैं।',
        },
        {
          moment: 'जब कोड पढ़कर बताने को कहा गया',
          safer_response: '"मेरा बैंक कभी ओटीपी नहीं माँगता" कहिए और कार्ड पर लिखे नंबर पर कॉल कीजिए।',
        },
      ],
    },
  },
  job_task: {
    did_well: {
      en: [
        'You questioned an offer that pays more than the work is worth.',
        'Noticing the first small payment as bait is the key skill here.',
      ],
      hi: [
        'आपने ऐसे ऑफ़र पर सवाल उठाया जो काम से कहीं ज़्यादा पैसे देता है।',
        'पहली छोटी रक़म को चारा समझना ही यहाँ असली कौशल है।',
      ],
    },
    improve: {
      en: [
        {
          moment: 'When the first Rs 150 arrived',
          safer_response: 'A small real payment exists only to make the big deposit feel safe.',
        },
        {
          moment: 'When a deposit was needed to withdraw',
          safer_response: 'No real job ever asks you to pay to get paid. Stop at that sentence.',
        },
      ],
      hi: [
        {
          moment: 'जब पहले 150 रुपये आए',
          safer_response: 'छोटी असली रक़म सिर्फ़ इसलिए आती है ताकि बड़ी जमा राशि सुरक्षित लगे।',
        },
        {
          moment: 'जब पैसे निकालने के लिए जमा माँगा गया',
          safer_response: 'कोई असली नौकरी पैसे पाने के लिए पैसे नहीं माँगती। वहीं रुक जाइए।',
        },
      ],
    },
  },
  personalised: {
    did_well: {
      en: [
        'You saw how quickly public details turn into a believable call.',
        'Treating a caller who "already knows things" as more suspicious, not less, is correct.',
      ],
      hi: [
        'आपने देखा कि सार्वजनिक जानकारी कितनी जल्दी भरोसेमंद कॉल बन जाती है।',
        'जो कॉलर "पहले से सब जानता है", उस पर ज़्यादा शक करना सही है।',
      ],
    },
    improve: {
      en: [
        {
          moment: 'When the caller used a detail from your post',
          safer_response: 'Knowing your details proves nothing. Ask for a reference and call the office yourself.',
        },
      ],
      hi: [
        {
          moment: 'जब कॉलर ने आपकी पोस्ट की जानकारी इस्तेमाल की',
          safer_response: 'आपकी जानकारी पता होना कोई सबूत नहीं। संदर्भ संख्या लीजिए और दफ़्तर में ख़ुद कॉल कीजिए।',
        },
      ],
    },
  },
};

/** Quote the scammer lines that actually used each tactic, from the transcript. */
export function staticDebrief(
  personaId: PersonaId,
  lang: Lang,
  history: SparMessage[],
  knownFacts: string[] = [],
): DebriefResponse {
  const persona = PERSONAS[personaId];
  const scammerLines = history.filter((m) => m.role === 'scammer').map((m) => m.text);
  const base = STATIC[personaId];

  /**
   * Pair each tactic with a line that genuinely shows it, by running the rule
   * engine over the scammer's own lines. A tactic with no matching line falls
   * back to the library example, which is labelled as an example, not a quote.
   */
  const matched = new Map<TacticId, string>();
  for (const line of scammerLines) {
    for (const finding of runRules(line, { lang })) {
      if (!matched.has(finding.tactic)) matched.set(finding.tactic, line);
    }
  }

  const tactics_seen = persona.tactics
    .slice(0, 4)
    .map((tactic) => ({
      tactic,
      quote: matched.get(tactic) ?? TACTICS[tactic].example[lang],
    }));

  const improve = [...base.improve[lang]];
  for (const fact of knownFacts.slice(0, 2)) {
    improve.push({
      moment:
        lang === 'hi'
          ? `जब उन्होंने यह जानकारी इस्तेमाल की: ${fact}`
          : `When they used this detail: ${fact}`,
      safer_response:
        lang === 'hi'
          ? 'यह जानकारी आपकी पोस्ट से मिली थी। ऐसी बातें पोस्ट करने से पहले सोचिए, और कॉलर की जानकारी को सबूत न मानिए।'
          : 'They knew this because it was visible in your post. Details a caller already has are never proof of who they are.',
    });
  }

  return { tactics_seen, did_well: base.did_well[lang], improve, fallback: true };
}
