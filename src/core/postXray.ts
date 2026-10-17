/**
 * Post X-Ray, browser side: photo metadata, caption rules and the
 * known-facts list that powers the attacker's view.
 * Known facts live in memory only and are cleared when the page is left.
 */

import type { Lang, Localised } from './tactics';
import type { Evidence } from './types';
import type { CaptionLeakType, VisualLeakLabel } from './contracts';
import type { FactKind } from './personas';

export type XrayFindingKind = 'metadata' | 'caption' | 'visual';

export interface XrayFinding {
  id: string;
  kind: XrayFindingKind;
  /** Where the finding came from. Metadata and caption rules are browser-local. */
  evidence: Evidence;
  title: string;
  detail: string;
  /** Caption findings carry the exact substring and its span. */
  text?: string;
  start?: number;
  end?: number;
  leakType?: CaptionLeakType;
  visualLabel?: VisualLeakLabel;
  /** Normalised 0–1000, [ymin, xmin, ymax, xmax]. */
  box?: [number, number, number, number];
}

/* -------------------------------------------------------------- metadata */

export interface PhotoMetadata {
  latitude?: number;
  longitude?: number;
  make?: string;
  model?: string;
  dateTimeOriginal?: string;
}

const L = (en: string, hi: string): Localised => ({ en, hi });

export function metadataFindings(meta: PhotoMetadata, lang: Lang): XrayFinding[] {
  const out: XrayFinding[] = [];

  if (typeof meta.latitude === 'number' && typeof meta.longitude === 'number') {
    const lat = meta.latitude.toFixed(3);
    const lon = meta.longitude.toFixed(3);
    out.push({
      id: 'meta_gps',
      kind: 'metadata',
      evidence: 'rule',
      title: L('Location is stored inside this file', 'इस फ़ाइल के अंदर लोकेशन सेव है')[lang],
      detail: L(
        `Anyone who receives the original file can read roughly ${lat}, ${lon}.`,
        `जिसे भी असली फ़ाइल मिलेगी, वह लगभग ${lat}, ${lon} पढ़ सकता है।`,
      )[lang],
    });
  }

  if (meta.make || meta.model) {
    const device = [meta.make, meta.model].filter(Boolean).join(' ');
    out.push({
      id: 'meta_device',
      kind: 'metadata',
      evidence: 'rule',
      title: L('Your device model is stored in this file', 'इस फ़ाइल में आपके डिवाइस का मॉडल सेव है')[lang],
      detail: L(
        `The file says it was taken with a ${device}. On its own this is minor, but it links your photos together.`,
        `फ़ाइल बताती है कि यह ${device} से ली गई है। अकेले यह छोटी बात है, पर इससे आपकी फ़ोटो आपस में जुड़ जाती हैं।`,
      )[lang],
    });
  }

  if (meta.dateTimeOriginal) {
    out.push({
      id: 'meta_time',
      kind: 'metadata',
      evidence: 'rule',
      title: L('The exact time is stored in this file', 'इस फ़ाइल में सही समय सेव है')[lang],
      detail: L(
        `Taken at ${meta.dateTimeOriginal}. Times across several posts show your daily routine.`,
        `${meta.dateTimeOriginal} पर ली गई। कई पोस्ट के समय मिलकर आपकी दिनचर्या बता देते हैं।`,
      )[lang],
    });
  }

  return out;
}

export const NO_METADATA: Localised = L(
  'No location data found in this file.',
  'इस फ़ाइल में कोई लोकेशन जानकारी नहीं मिली।',
);

/* ------------------------------------------------------------ caption rules */

interface CaptionRule {
  id: string;
  type: CaptionLeakType;
  pattern: RegExp;
  title: Localised;
  detail: Localised;
}

const CAPTION_RULES: CaptionRule[] = [
  {
    id: 'cap_birthday',
    type: 'birthday',
    pattern: /\b(birthday|bday|b'day|turning \d{1,2}|happy \d{1,2}(st|nd|rd|th)|janamdin)\b|जन्मदिन/gi,
    title: L('Birthday or age', 'जन्मदिन या उम्र'),
    detail: L(
      'A date of birth is a common security question and a common way to pose as someone who knows you.',
      'जन्मतिथि आम सुरक्षा सवाल है और आपको जानने वाला बनकर ठगने का आसान रास्ता भी।',
    ),
  },
  {
    id: 'cap_absence',
    type: 'absence',
    pattern:
      /\b(till|until|upto|back on)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2})\b|\b(away|out of town|vacation|holiday|trip to|travelling|traveling|flying to)\b|छुट्टी|बाहर जा रहे|घूमने/gi,
    title: L('You are away from home', 'आप घर से बाहर हैं'),
    detail: L(
      'Saying when the house is empty is used for break-ins and for "I am at your gate" calls.',
      'घर कब खाली है यह बताना चोरी और "मैं आपके गेट पर हूँ" जैसी कॉल के काम आता है।',
    ),
  },
  {
    id: 'cap_school',
    type: 'school',
    pattern:
      /\b(school|vidyalaya|academy|public school|convent|class \d{1,2}|grade \d{1,2}|std \d{1,2})\b|विद्यालय|स्कूल|कक्षा/gi,
    title: L('School or class', 'स्कूल या कक्षा'),
    detail: L(
      'A school name is enough for a convincing "fee payment failed" call about your child.',
      'स्कूल का नाम भर काफ़ी है आपके बच्चे की "फ़ीस फ़ेल हो गई" वाली भरोसेमंद कॉल के लिए।',
    ),
  },
  {
    id: 'cap_address',
    type: 'location',
    pattern:
      /\b(flat no\.?|flat|house no\.?|plot no\.?|sector \d+|block [a-z0-9]+|colony|nagar|vihar|enclave|apartment|society|street|gali)\b|मकान नंबर|सेक्टर|कॉलोनी|नगर|गली/gi,
    title: L('Address details', 'पते की जानकारी'),
    detail: L(
      'Address words plus a photo of the gate are enough to find your door.',
      'पते के शब्द और गेट की फ़ोटो मिलकर आपके दरवाज़े तक पहुँचा देते हैं।',
    ),
  },
  {
    id: 'cap_family',
    type: 'family',
    pattern:
      /\b(my (son|daughter|wife|husband|mother|father|beta|beti)|papa|mummy|mom|dad|bhai|behen|nani|dadi)\b|बेटा|बेटी|पत्नी|पति|माँ|पापा|भाई|बहन/gi,
    title: L('Family members', 'परिवार के सदस्य'),
    detail: L(
      'Knowing who lives with you makes a "your relative is in trouble" call believable.',
      'आपके साथ कौन रहता है यह पता होने से "आपका रिश्तेदार मुसीबत में है" वाली कॉल सच लगती है।',
    ),
  },
  {
    id: 'cap_routine',
    type: 'routine',
    pattern:
      /\b(every (morning|evening|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|daily at|gym at|office at|tuition at|\b\d{1,2}(:\d{2})?\s?(am|pm)\b)/gi,
    title: L('Your routine', 'आपकी दिनचर्या'),
    detail: L(
      'A fixed routine tells a stranger when you and your family are predictable.',
      'तय दिनचर्या से अजनबी जान लेता है कि आप और आपका परिवार कब कहाँ मिलेंगे।',
    ),
  },
  {
    id: 'cap_contact',
    type: 'contact',
    pattern: /(?<![\d])(?:(?:\+?91|0)[ -]?)?[6-9]\d{2}[ -]?\d{3}[ -]?\d{4}(?![\d])|\b[\w.+-]+@[\w-]+\.[\w.-]+\b/g,
    title: L('Contact details', 'संपर्क जानकारी'),
    detail: L(
      'A public phone number or email is the starting point of most scam calls.',
      'सार्वजनिक फ़ोन नंबर या ईमेल ही ज़्यादातर ठगी कॉल की शुरुआत होती है।',
    ),
  },
];

export function captionFindings(caption: string, lang: Lang): XrayFinding[] {
  if (!caption.trim()) return [];
  const out: XrayFinding[] = [];

  for (const rule of CAPTION_RULES) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags);
    for (const m of caption.matchAll(re)) {
      const start = m.index ?? 0;
      out.push({
        id: `${rule.id}@${start}`,
        kind: 'caption',
        evidence: 'rule',
        title: rule.title[lang],
        detail: rule.detail[lang],
        text: m[0],
        start,
        end: start + m[0].length,
        leakType: rule.type,
      });
    }
  }

  return out.sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
}

/* ------------------------------------------------------------- known facts */

const VISUAL_FACT: Record<VisualLeakLabel, Localised> = {
  school_logo: L('attends a school whose badge is visible in the photo', 'ऐसे स्कूल में पढ़ता है जिसका बैज फ़ोटो में दिख रहा है'),
  uniform: L('wears a school uniform visible in the photo', 'फ़ोटो में स्कूल यूनिफ़ॉर्म पहने दिख रहा है'),
  house_number: L('lives at the house number visible in the photo', 'फ़ोटो में दिख रहे मकान नंबर पर रहता है'),
  vehicle_plate: L('owns the vehicle whose number plate is visible', 'उस गाड़ी का मालिक है जिसकी नंबर प्लेट दिख रही है'),
  id_document: L('has an ID document visible in the photo', 'फ़ोटो में एक पहचान पत्र दिख रहा है'),
  boarding_pass: L('is travelling, shown by a boarding pass in the photo', 'यात्रा कर रहा है, फ़ोटो में बोर्डिंग पास से पता चलता है'),
  screen_content: L('has a phone or computer screen visible in the photo', 'फ़ोटो में फ़ोन या कंप्यूटर की स्क्रीन दिख रही है'),
  street_sign: L('lives near the street shown on the sign in the photo', 'फ़ोटो के साइन बोर्ड वाली गली के पास रहता है'),
  landmark: L('lives or spends time near a recognisable landmark', 'किसी पहचाने जाने वाले लैंडमार्क के पास रहता या जाता है'),
  other: L('has another identifying detail visible in the photo', 'फ़ोटो में कोई और पहचान वाली बात दिख रही है'),
};

const CAPTION_FACT: Record<CaptionLeakType, Localised> = {
  school: L('mentioned a school or class in the caption', 'कैप्शन में स्कूल या कक्षा बताई'),
  location: L('mentioned where they live in the caption', 'कैप्शन में बताया कि वे कहाँ रहते हैं'),
  absence: L('said the family is away from home', 'बताया कि परिवार घर से बाहर है'),
  birthday: L('mentioned a birthday or age', 'जन्मदिन या उम्र बताई'),
  contact: L('left a phone number or email in the caption', 'कैप्शन में फ़ोन नंबर या ईमेल छोड़ा'),
  family: L('named a family member', 'परिवार के सदस्य का ज़िक्र किया'),
  routine: L('described a fixed daily routine', 'अपनी तय दिनचर्या बताई'),
};

export interface KnownFacts {
  facts: string[];
  kinds: FactKind[];
}

const CAPTION_KIND: Record<CaptionLeakType, FactKind> = {
  school: 'school',
  location: 'location',
  absence: 'absence',
  birthday: 'other',
  contact: 'contact',
  family: 'family',
  routine: 'other',
};

const VISUAL_KIND: Partial<Record<VisualLeakLabel, FactKind>> = {
  school_logo: 'school',
  uniform: 'school',
  house_number: 'location',
  street_sign: 'location',
  landmark: 'location',
  boarding_pass: 'absence',
};

/**
 * Build the attacker's fact list from THIS session's findings only.
 * Never includes the raw caption text, a phone number or an exact address.
 */
export function buildKnownFacts(findings: XrayFinding[], lang: Lang): KnownFacts {
  const facts: string[] = [];
  const kinds = new Set<FactKind>();

  for (const f of findings) {
    if (f.kind === 'visual' && f.visualLabel) {
      facts.push(VISUAL_FACT[f.visualLabel][lang]);
      kinds.add(VISUAL_KIND[f.visualLabel] ?? 'other');
    } else if (f.kind === 'caption' && f.leakType) {
      facts.push(CAPTION_FACT[f.leakType][lang]);
      kinds.add(CAPTION_KIND[f.leakType]);
    } else if (f.kind === 'metadata' && f.id === 'meta_gps') {
      facts.push(
        L('posts photos with the location saved inside them', 'ऐसी फ़ोटो पोस्ट करता है जिनमें लोकेशन सेव रहती है')[lang],
      );
      kinds.add('location');
    }
  }

  return { facts: [...new Set(facts)].slice(0, 6), kinds: [...kinds] };
}
