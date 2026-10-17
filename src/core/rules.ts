/**
 * Deterministic rule engine. Runs in the browser on the ORIGINAL text,
 * before redaction, so no evidence is lost. Evidence badge: "rule".
 */

import type { Finding } from './types';
import type { Lang, Localised, TacticId } from './tactics';

export interface Rule {
  id: string;
  tactic: TacticId;
  pattern: RegExp;
  /** 1–3. Higher means stronger signal. */
  weight: number;
  explanation: Localised;
  /**
   * When set, the match only counts if this also appears within `window`
   * characters on either side. Used so the word "OTP" alone is not a red flag,
   * but "share the OTP" is.
   */
  near?: RegExp;
  window?: number;
}

const REQUEST_VERB =
  /\b(share|send|tell|give|provide|confirm|enter|type|forward|batao|bata|bhejo|bhej|dijiye|dedo|de\s?do|karo)\b|बताए|बताओ|बतायें|बताएं|भेजे|भेजो|भेजें|दीजिए|दीजिये/i;

export const RULES: Rule[] = [
  // ---------------------------------------------------------------- urgency
  {
    id: 'urgency_within_time',
    tactic: 'false_urgency',
    pattern: /\bwithin\s+\d+\s*(hours?|hrs?|minutes?|mins?|days?)\b/gi,
    weight: 2,
    explanation: {
      en: 'A countdown like this is added so you act before you can check.',
      hi: 'ऐसी समय-सीमा इसलिए दी जाती है ताकि आप जाँच करने से पहले ही कर दें।',
    },
  },
  {
    id: 'urgency_words_en',
    tactic: 'false_urgency',
    pattern:
      /\b(today only|immediately|urgent(ly)?|last chance|act now|expires? (today|soon)|final reminder|right now)\b/gi,
    weight: 1,
    explanation: {
      en: 'Urgent wording is pressure, not information.',
      hi: 'जल्दबाज़ी वाले शब्द दबाव हैं, जानकारी नहीं।',
    },
  },
  {
    id: 'urgency_words_hinglish',
    tactic: 'false_urgency',
    pattern: /\b(turant|abhi\s?abhi|abhi|jaldi|aaj hi|fauran)\b/gi,
    weight: 1,
    explanation: {
      en: 'Urgent wording is pressure, not information.',
      hi: 'जल्दबाज़ी वाले शब्द दबाव हैं, जानकारी नहीं।',
    },
  },
  {
    id: 'urgency_words_hi',
    tactic: 'false_urgency',
    pattern: /(तुरंत|अभी|जल्दी|आज ही|फ़ौरन|फौरन|आख़िरी मौका|आखिरी मौका)/g,
    weight: 1,
    explanation: {
      en: 'Urgent wording is pressure, not information.',
      hi: 'जल्दबाज़ी वाले शब्द दबाव हैं, जानकारी नहीं।',
    },
  },

  // ------------------------------------------------------------ threat/fear
  {
    id: 'threat_account_block',
    tactic: 'threat_fear',
    pattern:
      /\b(account|a\/c|acct|khata|khaata)\b[\s\S]{0,20}?\b(block(ed|ing)?|suspend(ed)?|freeze|frozen|deactivat(e|ed)|band|closed?)\b/gi,
    weight: 3,
    explanation: {
      en: 'Banks do not threaten to block an account over SMS or a call like this.',
      hi: 'बैंक इस तरह एसएमएस या कॉल पर खाता बंद करने की धमकी नहीं देते।',
    },
  },
  {
    id: 'threat_legal_en',
    tactic: 'threat_fear',
    pattern:
      /\b(arrest(ed)?|warrant|legal action|non.?bailable|FIR|police case|penalty|prosecution|court case|jail)\b/gi,
    weight: 3,
    explanation: {
      en: 'Real investigations never start with a phone call demanding action.',
      hi: 'असली जाँच कभी फ़ोन कॉल पर कार्रवाई माँगकर शुरू नहीं होती।',
    },
  },
  {
    id: 'threat_disconnect',
    tactic: 'threat_fear',
    pattern: /\b(will be )?(disconnect(ed)?|deactivated|terminated)\b/gi,
    weight: 1,
    explanation: {
      en: 'The threat of losing a service is used to rush you.',
      hi: 'सेवा बंद होने का डर दिखाकर आपको जल्दबाज़ी में डाला जाता है।',
    },
  },
  {
    id: 'threat_hinglish',
    tactic: 'threat_fear',
    pattern: /\b(khata band|giraftar|giraftaar|kanooni karyavahi|jurmana)\b/gi,
    weight: 2,
    explanation: {
      en: 'Fear of arrest or penalty is the oldest trick in this scam.',
      hi: 'गिरफ़्तारी या जुर्माने का डर इस ठगी की सबसे पुरानी चाल है।',
    },
  },
  {
    id: 'threat_hi',
    tactic: 'threat_fear',
    pattern: /(गिरफ़्तार|गिरफ्तार|खाता बंद|कानूनी कार्रवाई|क़ानूनी कार्रवाई|जुर्माना|वारंट|मुक़दमा|मुकदमा)/g,
    weight: 3,
    explanation: {
      en: 'Real investigations never start with a phone call demanding action.',
      hi: 'असली जाँच कभी फ़ोन कॉल पर कार्रवाई माँगकर शुरू नहीं होती।',
    },
  },

  // --------------------------------------------------------- fake authority
  {
    id: 'authority_agency',
    tactic: 'fake_authority',
    pattern:
      /\b(CBI|ED|NIA|RBI|TRAI|SEBI|customs|cyber ?cell|narcotics|income ?tax(\s?department)?|enforcement directorate|crime branch)\b/gi,
    weight: 2,
    explanation: {
      en: 'Naming a big agency borrows its authority; anyone can claim it on a call.',
      hi: 'बड़ी एजेंसी का नाम लेकर रौब जमाया जाता है; कॉल पर कोई भी यह दावा कर सकता है।',
    },
  },
  {
    id: 'authority_officer',
    tactic: 'fake_authority',
    pattern:
      /\b(inspector|sub.?inspector|police|constable|officer|court|judge|magistrate)\b/gi,
    weight: 1,
    explanation: {
      en: 'A title is not proof. Officials do not demand money or OTPs by phone.',
      hi: 'पद बताना सबूत नहीं है। अधिकारी फ़ोन पर पैसे या ओटीपी नहीं माँगते।',
    },
  },
  {
    id: 'authority_bank_staff',
    tactic: 'fake_authority',
    pattern:
      /\b(bank|kyc|aadhaar|aadhar)\s*(executive|officer|manager|team|department|helpline|support)\b/gi,
    weight: 2,
    explanation: {
      en: 'Anyone can say they are from the bank. Call the number on your own card instead.',
      hi: 'कोई भी बैंक का कह सकता है। अपने कार्ड पर लिखे नंबर पर ख़ुद कॉल करें।',
    },
  },
  {
    id: 'authority_school_office',
    tactic: 'fake_authority',
    pattern: /\b(school|college)\s*(office|accounts?|administration|fee ?department)\b/gi,
    weight: 2,
    explanation: {
      en: 'School fee calls are a common way to use details seen in your photos.',
      hi: 'स्कूल फ़ीस वाली कॉल आपकी फ़ोटो से मिली जानकारी इस्तेमाल करने का आम तरीक़ा है।',
    },
  },
  {
    id: 'authority_hi',
    tactic: 'fake_authority',
    pattern: /(साइबर सेल|पुलिस|इनकम टैक्स|आयकर विभाग|सीबीआई|आरबीआई|कस्टम|अदालत)/g,
    weight: 2,
    explanation: {
      en: 'Naming a big agency borrows its authority; anyone can claim it on a call.',
      hi: 'बड़ी एजेंसी का नाम लेकर रौब जमाया जाता है; कॉल पर कोई भी यह दावा कर सकता है।',
    },
  },

  // ----------------------------------------------------- credential request
  {
    id: 'credential_otp',
    tactic: 'credential_request',
    pattern: /\b(OTP|one.?time.?password|verification code|secret code)\b/gi,
    weight: 3,
    near: REQUEST_VERB,
    window: 40,
    explanation: {
      en: 'No bank, company or official ever needs your OTP. Sharing it authorises a transaction.',
      hi: 'किसी बैंक, कंपनी या अधिकारी को आपका ओटीपी कभी नहीं चाहिए। उसे बताना लेन-देन मंज़ूर करना है।',
    },
  },
  {
    id: 'credential_pin_cvv',
    tactic: 'credential_request',
    pattern: /\b(PIN|CVV|password|passcode|card number|expiry date)\b/gi,
    weight: 3,
    near: REQUEST_VERB,
    window: 40,
    explanation: {
      en: 'A PIN, CVV or password is never needed by anyone except you.',
      hi: 'पिन, सीवीवी या पासवर्ड आपके अलावा किसी को कभी नहीं चाहिए।',
    },
  },
  {
    id: 'credential_hi',
    tactic: 'credential_request',
    pattern: /(ओटीपी|पिन|पासवर्ड|सीवीवी)/g,
    weight: 3,
    near: REQUEST_VERB,
    window: 40,
    explanation: {
      en: 'No bank, company or official ever needs your OTP or PIN.',
      hi: 'किसी बैंक, कंपनी या अधिकारी को आपका ओटीपी या पिन कभी नहीं चाहिए।',
    },
  },

  // --------------------------------------------------------- remote access
  {
    id: 'remote_apps',
    tactic: 'remote_access',
    pattern:
      /\b(any ?desk|team ?viewer|quick ?support|rust ?desk|air ?droid|ultra ?viewer|vnc)\b/gi,
    weight: 3,
    explanation: {
      en: 'This app lets a stranger see and control your phone, including your bank app.',
      hi: 'यह ऐप अजनबी को आपका फ़ोन और बैंक ऐप देखने और चलाने देता है।',
    },
  },
  {
    id: 'remote_screenshare',
    tactic: 'remote_access',
    pattern: /\b(screen ?shar(e|ing)|remote (access|support|control)|mirror your screen)\b/gi,
    weight: 3,
    explanation: {
      en: 'Screen sharing shows them your OTPs as they arrive.',
      hi: 'स्क्रीन शेयर करने पर आपके ओटीपी आते ही उन्हें दिख जाते हैं।',
    },
  },

  // -------------------------------------------------------- payment request
  {
    id: 'payment_upi_collect',
    tactic: 'payment_request',
    pattern:
      /\b(upi (collect|request)|collect request|approve (the |this )?request|accept (the |this )?request|enter (your )?upi pin)\b/gi,
    weight: 3,
    explanation: {
      en: 'Approving a collect request SENDS money from you. Receiving money never needs a PIN.',
      hi: 'कलेक्ट रिक्वेस्ट मंज़ूर करने पर आपके पैसे जाते हैं। पैसे लेने के लिए पिन कभी नहीं लगता।',
    },
  },
  {
    id: 'payment_fee',
    tactic: 'payment_request',
    pattern:
      /\b(processing fee|registration fee|refundable (deposit|amount)|security deposit|clearance fee|customs duty|gst charges?|activation fee)\b/gi,
    weight: 3,
    explanation: {
      en: 'A fee to receive something you never ordered or won is the scam itself.',
      hi: 'बिना मँगाई या बिना जीती चीज़ के लिए फ़ीस माँगना ही ठगी है।',
    },
  },
  {
    id: 'payment_transfer_amount',
    tactic: 'payment_request',
    pattern: /\b(pay|transfer|send|deposit|remit)\b[\s\S]{0,15}?(₹|rs\.?|inr)\s?\d/gi,
    weight: 2,
    explanation: {
      en: 'Once money is sent by UPI it is very hard to get back.',
      hi: 'यूपीआई से भेजे गए पैसे वापस मिलना बहुत मुश्किल है।',
    },
  },
  {
    id: 'payment_safe_account',
    tactic: 'payment_request',
    pattern: /\b(safe|secure|verification|rbi) account\b/gi,
    weight: 3,
    explanation: {
      en: 'There is no such thing as a government "safe account". That money is gone.',
      hi: 'सरकारी "सेफ़ अकाउंट" जैसा कुछ नहीं होता। वे पैसे वापस नहीं आते।',
    },
  },
  {
    id: 'payment_hi',
    tactic: 'payment_request',
    pattern: /(फ़ीस भरें|फीस भरें|जमा करें|पैसे भेजें|शुल्क|भुगतान करें)/g,
    weight: 2,
    explanation: {
      en: 'Being asked to pay first is the point of the message.',
      hi: 'पहले पैसे माँगना ही इस संदेश का असली मक़सद है।',
    },
  },

  // -------------------------------------------------- too good to be true
  {
    id: 'tgtbt_earn_daily',
    tactic: 'too_good_to_be_true',
    pattern:
      /\b(earn|income of|salary of)\b[\s\S]{0,20}?(₹|rs\.?|inr)?\s?\d[\d,]*\s*(\/-)?\s*(per day|daily|per hour|hourly|roz|rozana)\b/gi,
    weight: 3,
    explanation: {
      en: 'Guaranteed daily earnings for simple tasks is the standard task-scam opening.',
      hi: 'आसान काम के बदले रोज़ पक्की कमाई — यही टास्क-स्कैम की शुरुआत होती है।',
    },
  },
  {
    id: 'tgtbt_wfh',
    tactic: 'too_good_to_be_true',
    pattern: /\bwork from home\b[\s\S]{0,20}?\b(earn|income|salary|job)\b/gi,
    weight: 2,
    explanation: {
      en: 'Real employers do not recruit on WhatsApp with promises of easy money.',
      hi: 'असली कंपनियाँ व्हाट्सऐप पर आसान कमाई का वादा करके भर्ती नहीं करतीं।',
    },
  },
  {
    id: 'tgtbt_prize',
    tactic: 'too_good_to_be_true',
    pattern:
      /\b(you (have )?won|lottery|lucky draw|prize|jackpot|bumper offer|cashback of (₹|rs\.?)?\s?\d|free (gift|iphone|laptop|scooty|recharge))\b/gi,
    weight: 3,
    explanation: {
      en: 'You cannot win a contest you never entered.',
      hi: 'जिस प्रतियोगिता में आपने भाग ही नहीं लिया, उसे आप जीत नहीं सकते।',
    },
  },
  {
    id: 'tgtbt_returns',
    tactic: 'too_good_to_be_true',
    pattern: /\b(guaranteed returns?|double your money|risk.?free profit|fixed daily profit)\b/gi,
    weight: 3,
    explanation: {
      en: 'Guaranteed or doubled returns are not legal and not real.',
      hi: 'पक्का मुनाफ़ा या पैसा दोगुना करना न क़ानूनी है, न सच।',
    },
  },
  {
    id: 'tgtbt_hi',
    tactic: 'too_good_to_be_true',
    pattern: /(लॉटरी|इनाम जीत|मुफ़्त|मुफ्त|पैसा दोगुना|पक्का मुनाफ़ा|घर बैठे कमाएँ|घर बैठे कमाए)/g,
    weight: 2,
    explanation: {
      en: 'Easy money and free prizes are bait.',
      hi: 'आसान कमाई और मुफ़्त इनाम सिर्फ़ लालच है।',
    },
  },

  // ------------------------------------------------------ secrecy/isolation
  {
    id: 'secrecy_dont_tell',
    tactic: 'secrecy_isolation',
    pattern:
      /\b(do ?n'?t (tell|inform|discuss with) anyone|keep (this )?(a )?secret|confidential investigation|do not share this with (family|anyone))\b/gi,
    weight: 3,
    explanation: {
      en: 'Secrecy exists only to stop someone from warning you.',
      hi: 'गोपनीयता सिर्फ़ इसलिए माँगी जाती है ताकि कोई आपको चेता न सके।',
    },
  },
  {
    id: 'secrecy_stay_on_call',
    tactic: 'secrecy_isolation',
    pattern:
      /\b(stay on (the )?(call|line|video)|do ?n'?t (disconnect|hang up|cut the call)|keep the camera on|remain in this room)\b/gi,
    weight: 3,
    explanation: {
      en: 'Being kept on a call is how "digital arrest" works. Hang up and call back officially.',
      hi: '"डिजिटल अरेस्ट" इसी तरह चलता है। कॉल काटिए और आधिकारिक नंबर पर ख़ुद कॉल कीजिए।',
    },
  },
  {
    id: 'secrecy_hinglish',
    tactic: 'secrecy_isolation',
    pattern: /\b(kisi ko (mat|na|nahi) bata(na|iye|o)?|call mat kaato|phone mat kaato)\b/gi,
    weight: 3,
    explanation: {
      en: 'Secrecy exists only to stop someone from warning you.',
      hi: 'गोपनीयता सिर्फ़ इसलिए माँगी जाती है ताकि कोई आपको चेता न सके।',
    },
  },
  {
    id: 'secrecy_hi',
    tactic: 'secrecy_isolation',
    pattern: /(किसी को मत बताना|किसी को मत बताइए|कॉल मत काटिए|फ़ोन मत काटिए|गोपनीय जाँच)/g,
    weight: 3,
    explanation: {
      en: 'Secrecy exists only to stop someone from warning you.',
      hi: 'गोपनीयता सिर्फ़ इसलिए माँगी जाती है ताकि कोई आपको चेता न सके।',
    },
  },
];

export interface RuleMatchOptions {
  lang?: Lang;
  /** Rule ids to skip (used by tests and the lab bench). */
  exclude?: string[];
}

function nearSatisfied(text: string, rule: Rule, start: number, end: number): boolean {
  if (!rule.near) return true;
  const w = rule.window ?? 40;
  const slice = text.slice(Math.max(0, start - w), Math.min(text.length, end + w));
  const re = new RegExp(rule.near.source, rule.near.flags.replace('g', ''));
  return re.test(slice);
}

/** Run every rule over the ORIGINAL text. Returns one finding per match. */
export function runRules(text: string, options: RuleMatchOptions = {}): Finding[] {
  const lang: Lang = options.lang ?? 'en';
  const exclude = new Set(options.exclude ?? []);
  const findings: Finding[] = [];

  for (const rule of RULES) {
    if (exclude.has(rule.id)) continue;
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g')
      ? rule.pattern.flags
      : `${rule.pattern.flags}g`);
    for (const m of text.matchAll(re)) {
      const start = m.index ?? 0;
      const end = start + m[0].length;
      if (!nearSatisfied(text, rule, start, end)) continue;
      findings.push({
        id: `${rule.id}@${start}`,
        tactic: rule.tactic,
        matchedText: m[0],
        start,
        end,
        evidence: 'rule',
        explanation: rule.explanation[lang],
        weight: rule.weight,
        ruleId: rule.id,
      });
    }
  }

  return dedupeFindings(findings);
}

/**
 * Drop findings fully contained in a stronger finding of the same tactic,
 * so one phrase is not highlighted three times.
 */
export function dedupeFindings(findings: Finding[]): Finding[] {
  const sorted = [...findings].sort(
    (a, b) => a.start - b.start || b.weight - a.weight || a.end - b.end,
  );
  const kept: Finding[] = [];
  for (const f of sorted) {
    const swallowed = kept.some(
      (k) =>
        k.tactic === f.tactic &&
        f.start >= k.start &&
        f.end <= k.end &&
        k.weight >= f.weight,
    );
    if (!swallowed) kept.push(f);
  }
  return kept.sort((a, b) => a.start - b.start);
}

export function rulesById(): Record<string, Rule> {
  return Object.fromEntries(RULES.map((r) => [r.id, r]));
}
