/**
 * The shared tactic library. Defined once, used everywhere:
 * Check findings, claim mode, Sparring tags, debriefs and How it works.
 */

export type TacticId =
  | 'false_urgency'
  | 'threat_fear'
  | 'fake_authority'
  | 'credential_request'
  | 'remote_access'
  | 'payment_request'
  | 'too_good_to_be_true'
  | 'secrecy_isolation'
  | 'suspicious_link';

export type Lang = 'en' | 'hi';

export interface Localised {
  en: string;
  hi: string;
}

export interface Tactic {
  id: TacticId;
  name: Localised;
  /** Why this is manipulative, one line. */
  oneLiner: Localised;
  example: Localised;
}

export const TACTICS: Record<TacticId, Tactic> = {
  false_urgency: {
    id: 'false_urgency',
    name: { en: 'False urgency', hi: 'झूठी जल्दबाज़ी' },
    oneLiner: {
      en: 'A deadline is invented so you act before you can think or check.',
      hi: 'नकली समय-सीमा दी जाती है ताकि आप सोचने या जाँचने से पहले ही कर दें।',
    },
    example: {
      en: 'Your account will be blocked within 24 hours.',
      hi: 'आपका खाता 24 घंटे में बंद हो जाएगा।',
    },
  },
  threat_fear: {
    id: 'threat_fear',
    name: { en: 'Threats and fear', hi: 'धमकी और डर' },
    oneLiner: {
      en: 'Fear of arrest, loss or penalty is used to stop you from thinking clearly.',
      hi: 'गिरफ़्तारी, नुकसान या जुर्माने का डर दिखाकर आपकी सोच रोकी जाती है।',
    },
    example: {
      en: 'A warrant has been issued in your name.',
      hi: 'आपके नाम पर वारंट जारी हुआ है।',
    },
  },
  fake_authority: {
    id: 'fake_authority',
    name: { en: 'Fake authority', hi: 'नकली अधिकारी' },
    oneLiner: {
      en: 'Someone claims to be the police, a bank or a government body to borrow their power.',
      hi: 'कोई पुलिस, बैंक या सरकारी विभाग बनकर उनका रौब इस्तेमाल करता है।',
    },
    example: {
      en: 'This is Inspector Sharma from the CBI Cyber Cell.',
      hi: 'मैं सीबीआई साइबर सेल से इंस्पेक्टर शर्मा बोल रहा हूँ।',
    },
  },
  credential_request: {
    id: 'credential_request',
    name: { en: 'Asking for your secrets', hi: 'गोपनीय जानकारी माँगना' },
    oneLiner: {
      en: 'No real bank or official ever asks for an OTP, PIN, CVV or password.',
      hi: 'कोई असली बैंक या अधिकारी कभी ओटीपी, पिन, सीवीवी या पासवर्ड नहीं माँगता।',
    },
    example: {
      en: 'Please share the 6-digit OTP you just received.',
      hi: 'अभी आया 6 अंकों का ओटीपी बता दीजिए।',
    },
  },
  remote_access: {
    id: 'remote_access',
    name: { en: 'Remote access / screen share', hi: 'रिमोट एक्सेस / स्क्रीन शेयर' },
    oneLiner: {
      en: 'An app that shares your screen hands over your bank app and OTPs.',
      hi: 'स्क्रीन शेयर करने वाला ऐप आपका बैंक ऐप और ओटीपी उनके हाथ दे देता है।',
    },
    example: {
      en: 'Install AnyDesk so I can help you complete the KYC.',
      hi: 'केवाईसी पूरी करने के लिए AnyDesk इंस्टॉल कर लीजिए।',
    },
  },
  payment_request: {
    id: 'payment_request',
    name: { en: 'Pay first', hi: 'पहले पैसे भरवाना' },
    oneLiner: {
      en: 'A fee, deposit or "approve this request" moves money out of your account.',
      hi: 'फ़ीस, जमा राशि या "रिक्वेस्ट अप्रूव करें" आपके खाते से पैसे निकाल देता है।',
    },
    example: {
      en: 'Pay a refundable registration fee of Rs 499 to release the parcel.',
      hi: 'पार्सल छुड़ाने के लिए 499 रुपये की वापसी-योग्य फ़ीस भरें।',
    },
  },
  too_good_to_be_true: {
    id: 'too_good_to_be_true',
    name: { en: 'Too good to be true', hi: 'सच होने के लिए बहुत अच्छा' },
    oneLiner: {
      en: 'Easy money, prizes and guaranteed returns are bait, not offers.',
      hi: 'आसान कमाई, इनाम और पक्का मुनाफ़ा लालच है, कोई ऑफ़र नहीं।',
    },
    example: {
      en: 'Earn Rs 5,000 daily by liking videos from home.',
      hi: 'घर बैठे वीडियो लाइक करके रोज़ 5,000 रुपये कमाएँ।',
    },
  },
  secrecy_isolation: {
    id: 'secrecy_isolation',
    name: { en: 'Secrecy and isolation', hi: 'गोपनीयता और अलगाव' },
    oneLiner: {
      en: 'Keeping you on the line and away from family stops anyone from warning you.',
      hi: 'कॉल पर बनाए रखना और परिवार से दूर रखना, ताकि कोई आपको रोक न सके।',
    },
    example: {
      en: 'Do not disconnect and do not tell anyone at home.',
      hi: 'कॉल मत काटिए और घर में किसी को मत बताइए।',
    },
  },
  suspicious_link: {
    id: 'suspicious_link',
    name: { en: 'Suspicious link', hi: 'संदिग्ध लिंक' },
    oneLiner: {
      en: 'The link does not go where it claims, or imitates an official website.',
      hi: 'लिंक वहाँ नहीं जाता जहाँ का दावा है, या सरकारी/बैंक साइट की नकल करता है।',
    },
    example: {
      en: 'sbi-kyc-update.in/verify',
      hi: 'sbi-kyc-update.in/verify',
    },
  },
};

export const TACTIC_IDS = Object.keys(TACTICS) as TacticId[];

export function isTacticId(value: unknown): value is TacticId {
  return typeof value === 'string' && value in TACTICS;
}

export function tacticName(id: TacticId, lang: Lang): string {
  return TACTICS[id].name[lang];
}

/** Compact definition list injected into AI system prompts. */
export function tacticPromptList(): string {
  return TACTIC_IDS.map((id) => `- ${id}: ${TACTICS[id].oneLiner.en}`).join('\n');
}
