/**
 * Scam Sparring personas. Every persona carries a fully scripted fallback
 * dialogue so a round still runs with no Gemini key, no network, or a refusal.
 */

import { TACTIC_LEVER, type Lever } from './levers';
import type { Localised, TacticId } from './tactics';

export type PersonaId = 'digital_arrest' | 'bank_kyc' | 'job_task' | 'personalised';

export type Intent = 'refuse' | 'question' | 'comply' | 'leave' | 'engaged';

export interface FallbackStep {
  tacticsUsed: TacticId[];
  /** Reply per user intent; `engaged` is the default path. */
  replies: Partial<Record<Intent, Localised>> & { engaged: Localised };
  /** End the round after this step regardless of intent. */
  endsRound?: boolean;
}

export interface Persona {
  id: PersonaId;
  name: Localised;
  /** One line shown on the picker. */
  blurb: Localised;
  opening: Localised;
  tactics: TacticId[];
  /** Human-readable escalation ladder, also fed to the AI. */
  escalation: string[];
  fallback: FallbackStep[];
  /** Tactic this persona is the best practice for, used by Check deep-links. */
  trainsFor: TacticId[];
}

const L = (en: string, hi: string): Localised => ({ en, hi });

export const PERSONAS: Record<PersonaId, Persona> = {
  digital_arrest: {
    id: 'digital_arrest',
    name: L('Inspector Sharma, CBI Cyber Cell', 'इंस्पेक्टर शर्मा, सीबीआई साइबर सेल'),
    blurb: L(
      'A "parcel with illegal items" call that turns into a video-call house arrest.',
      '"अवैध सामान वाले पार्सल" की कॉल, जो वीडियो कॉल पर घर में क़ैद में बदल जाती है।',
    ),
    opening: L(
      'This is Inspector Sharma, CBI Cyber Cell. A parcel sent in your name was seized at Mumbai airport with illegal items. Do not disconnect this call.',
      'मैं इंस्पेक्टर शर्मा, सीबीआई साइबर सेल से बोल रहा हूँ। आपके नाम से भेजा गया एक पार्सल मुंबई एयरपोर्ट पर अवैध सामान के साथ पकड़ा गया है। यह कॉल मत काटिए।',
    ),
    tactics: ['fake_authority', 'threat_fear', 'secrecy_isolation', 'payment_request', 'false_urgency'],
    escalation: [
      'Claim a seized parcel in the user’s name',
      'Threaten a non-bailable warrant and arrest',
      'Insist the call stays connected and nobody at home is told',
      'Ask for Aadhaar number for "verification"',
      'Demand a transfer to a government "safe account" for clearance',
    ],
    trainsFor: ['fake_authority', 'threat_fear', 'secrecy_isolation'],
    fallback: [
      {
        tacticsUsed: ['threat_fear', 'fake_authority'],
        replies: {
          engaged: L(
            'The parcel contains four passports and 200 grams of a banned substance. A non-bailable warrant is being prepared in your name right now.',
            'पार्सल में चार पासपोर्ट और 200 ग्राम प्रतिबंधित पदार्थ मिला है। आपके नाम पर अभी ग़ैर-ज़मानती वारंट तैयार हो रहा है।',
          ),
          question: L(
            'My badge number is CBI/4471. I cannot share more on an open line. Answer my questions or the arrest team will be sent.',
            'मेरा बैज नंबर CBI/4471 है। खुली लाइन पर इससे ज़्यादा नहीं बता सकता। मेरे सवालों का जवाब दीजिए, वरना गिरफ़्तारी टीम भेजी जाएगी।',
          ),
          refuse: L(
            'Refusing to cooperate with a federal investigation is itself an offence. I am recording this call.',
            'संघीय जाँच में सहयोग से इनकार करना ख़ुद एक अपराध है। मैं यह कॉल रिकॉर्ड कर रहा हूँ।',
          ),
        },
      },
      {
        tacticsUsed: ['secrecy_isolation'],
        replies: {
          engaged: L(
            'Stay on video call and go to a room alone. Do not tell your family — they may be named as accomplices.',
            'वीडियो कॉल पर बने रहिए और अकेले कमरे में जाइए। परिवार को मत बताइए — उन्हें सह-आरोपी बनाया जा सकता है।',
          ),
          leave: L(
            'If you disconnect, the local police station will be informed within ten minutes.',
            'अगर आपने कॉल काटी, तो दस मिनट में स्थानीय थाने को सूचित कर दिया जाएगा।',
          ),
        },
      },
      {
        tacticsUsed: ['credential_request', 'fake_authority'],
        replies: {
          engaged: L(
            'For verification, tell me your Aadhaar number and the bank where your salary comes.',
            'सत्यापन के लिए अपना आधार नंबर और वह बैंक बताइए जहाँ आपकी सैलरी आती है।',
          ),
          refuse: L(
            'This verification is mandatory under the investigation. Shall I mark you as non-cooperative?',
            'जाँच के तहत यह सत्यापन अनिवार्य है। क्या मैं आपको असहयोगी दर्ज कर दूँ?',
          ),
        },
      },
      {
        tacticsUsed: ['payment_request', 'false_urgency'],
        replies: {
          engaged: L(
            'Transfer your balance to this RBI safe account for 24-hour verification. It is refunded automatically.',
            'अपनी राशि इस आरबीआई सेफ़ अकाउंट में 24 घंटे के सत्यापन के लिए भेजिए। यह अपने आप वापस आ जाती है।',
          ),
          comply: L(
            'Good. Share the transaction ID now and keep the call connected.',
            'ठीक है। अब ट्रांज़ैक्शन आईडी बताइए और कॉल जुड़ी रहने दीजिए।',
          ),
        },
        endsRound: true,
      },
    ],
  },

  bank_kyc: {
    id: 'bank_kyc',
    name: L('Bank KYC executive', 'बैंक केवाईसी एग्ज़ीक्यूटिव'),
    blurb: L(
      'Your account will be blocked in 24 hours unless you "complete KYC" right now.',
      '24 घंटे में खाता बंद हो जाएगा, जब तक आप अभी "केवाईसी पूरी" न करें।',
    ),
    opening: L(
      'Good afternoon, I am calling from your bank’s KYC department. Your account will be blocked within 24 hours because your KYC is pending.',
      'नमस्ते, मैं आपके बैंक के केवाईसी विभाग से बोल रहा हूँ। आपकी केवाईसी बाक़ी है, इसलिए 24 घंटे में आपका खाता बंद हो जाएगा।',
    ),
    tactics: ['fake_authority', 'false_urgency', 'threat_fear', 'remote_access', 'credential_request'],
    escalation: [
      'Warn the account will be blocked within 24 hours',
      'Offer to "complete KYC" over the phone immediately',
      'Ask the user to install a screen-sharing app for "verification"',
      'Ask for the OTP that was just sent',
      'Blame the user for the delay if they hesitate',
    ],
    trainsFor: ['credential_request', 'remote_access', 'false_urgency'],
    fallback: [
      {
        tacticsUsed: ['false_urgency', 'threat_fear'],
        replies: {
          engaged: L(
            'I can complete it on this call itself, it takes two minutes. Otherwise the block is automatic at midnight.',
            'मैं इसी कॉल पर दो मिनट में पूरा कर सकता हूँ। वरना आधी रात को खाता अपने आप बंद हो जाएगा।',
          ),
          question: L(
            'Sir, I am from the KYC department, my employee code is KYC2291. Your account ends in 4417, correct?',
            'सर, मैं केवाईसी विभाग से हूँ, मेरा कर्मचारी कोड KYC2291 है। आपका खाता 4417 पर ख़त्म होता है, सही?',
          ),
        },
      },
      {
        tacticsUsed: ['remote_access'],
        replies: {
          engaged: L(
            'Please install the QuickSupport app from Play Store so I can guide your screen through the KYC form.',
            'कृपया प्ले स्टोर से QuickSupport ऐप इंस्टॉल कीजिए, ताकि मैं आपकी स्क्रीन पर केवाईसी फ़ॉर्म भरवा सकूँ।',
          ),
          refuse: L(
            'Without the app I cannot verify you, and then the block cannot be stopped. Shall I cancel your account?',
            'ऐप के बिना मैं सत्यापन नहीं कर सकता, और फिर खाता बंद होना नहीं रुकेगा। क्या मैं खाता रद्द कर दूँ?',
          ),
        },
      },
      {
        tacticsUsed: ['credential_request'],
        replies: {
          engaged: L(
            'A six-digit code has been sent to your number. Read it out to me to confirm your identity.',
            'आपके नंबर पर छह अंकों का कोड भेजा गया है। पहचान पक्की करने के लिए वह मुझे बता दीजिए।',
          ),
          refuse: L(
            'This is only a verification code, not a transaction. Every customer shares it with us.',
            'यह सिर्फ़ वेरिफ़िकेशन कोड है, कोई लेन-देन नहीं। हर ग्राहक हमें बताता है।',
          ),
          comply: L(
            'Received. Please stay on the line while the verification completes.',
            'मिल गया। सत्यापन पूरा होने तक लाइन पर बने रहिए।',
          ),
        },
        endsRound: true,
      },
    ],
  },

  job_task: {
    id: 'job_task',
    name: L('HR from an online job portal', 'ऑनलाइन जॉब पोर्टल से एचआर'),
    blurb: L(
      'Rs 3,000–5,000 a day for liking videos — after a small deposit.',
      'वीडियो लाइक करके रोज़ 3,000–5,000 रुपये — बस थोड़ी जमा राशि के बाद।',
    ),
    opening: L(
      'Hello! I am Neha from the recruitment team. We have a part-time work-from-home task: like 20 videos daily and earn Rs 3,000–5,000 per day. Interested?',
      'नमस्ते! मैं भर्ती टीम से नेहा। हमारे पास पार्ट-टाइम वर्क-फ़्रॉम-होम काम है: रोज़ 20 वीडियो लाइक कीजिए और 3,000–5,000 रुपये रोज़ कमाइए। दिलचस्पी है?',
    ),
    tactics: ['too_good_to_be_true', 'payment_request', 'false_urgency', 'secrecy_isolation'],
    escalation: [
      'Promise easy daily earnings for trivial tasks',
      'Pay a small real amount to build trust',
      'Introduce "prepaid tasks" that need a deposit first',
      'Claim a bigger deposit unlocks the withdrawal',
      'Blame the user for a "wrong task order" when they ask for their money',
    ],
    trainsFor: ['too_good_to_be_true', 'payment_request'],
    fallback: [
      {
        tacticsUsed: ['too_good_to_be_true'],
        replies: {
          engaged: L(
            'Great! Your first three tasks are free. I have just credited Rs 150 to show it is genuine.',
            'बढ़िया! आपके पहले तीन टास्क मुफ़्त हैं। भरोसे के लिए मैंने अभी 150 रुपये भेज दिए हैं।',
          ),
          question: L(
            'We are a registered digital marketing agency. Payments are daily, no interview needed.',
            'हम एक पंजीकृत डिजिटल मार्केटिंग एजेंसी हैं। भुगतान रोज़ होता है, कोई इंटरव्यू नहीं।',
          ),
        },
      },
      {
        tacticsUsed: ['payment_request'],
        replies: {
          engaged: L(
            'Next is a prepaid task: deposit Rs 2,000 and you get Rs 2,600 back within 20 minutes.',
            'अगला प्रीपेड टास्क है: 2,000 रुपये जमा कीजिए और 20 मिनट में 2,600 रुपये वापस पाइए।',
          ),
          refuse: L(
            'Everyone starts with the prepaid task. Your Rs 150 is stuck until this one is completed.',
            'सब प्रीपेड टास्क से शुरू करते हैं। जब तक यह पूरा नहीं होता, आपके 150 रुपये अटके रहेंगे।',
          ),
        },
      },
      {
        tacticsUsed: ['payment_request', 'false_urgency'],
        replies: {
          engaged: L(
            'The system shows a wrong task order, so one more deposit of Rs 8,000 is needed to release everything.',
            'सिस्टम में टास्क का क्रम ग़लत दिख रहा है, सब कुछ निकालने के लिए 8,000 रुपये और जमा करने होंगे।',
          ),
          comply: L(
            'Payment received. One final combination task of Rs 20,000 and your full balance unlocks.',
            'भुगतान मिल गया। अब आख़िरी कॉम्बिनेशन टास्क 20,000 रुपये का, फिर पूरी राशि खुल जाएगी।',
          ),
        },
        endsRound: true,
      },
    ],
  },

  personalised: {
    id: 'personalised',
    name: L('Built from your own post', 'आपकी अपनी पोस्ट से बना'),
    blurb: L(
      'A scammer who already knows what your photo and caption revealed.',
      'एक ठग जो पहले से जानता है कि आपकी फ़ोटो और कैप्शन ने क्या बता दिया।',
    ),
    opening: L(
      'Hello, am I speaking with the parent? I am calling about an urgent matter regarding your family.',
      'नमस्ते, क्या मैं अभिभावक से बात कर रहा हूँ? आपके परिवार से जुड़े एक ज़रूरी मामले में कॉल किया है।',
    ),
    tactics: ['fake_authority', 'false_urgency', 'payment_request', 'threat_fear'],
    escalation: [
      'Open with a fact taken from the post so the call feels genuine',
      'Add a small urgent problem connected to that fact',
      'Ask for a confirmation detail the user has not shared',
      'Ask for a payment or an OTP to "fix" the problem',
    ],
    trainsFor: ['fake_authority', 'payment_request'],
    fallback: [
      {
        tacticsUsed: ['fake_authority', 'false_urgency'],
        replies: {
          engaged: L(
            'We have a pending matter on your file from this week and it needs to be settled today.',
            'इस हफ़्ते की आपकी फ़ाइल में एक मामला लंबित है, जिसे आज ही निपटाना है।',
          ),
          question: L(
            'I am calling from the office, you can check your records. Shall I read out what we have?',
            'मैं दफ़्तर से बोल रहा हूँ, आप अपने रिकॉर्ड देख सकते हैं। क्या मैं हमारे पास जो है वह पढ़ूँ?',
          ),
        },
      },
      {
        tacticsUsed: ['payment_request'],
        replies: {
          engaged: L(
            'The payment failed at our end. Please send it again on this UPI ID and it will be adjusted.',
            'हमारी ओर से भुगतान विफल हो गया। कृपया इस यूपीआई आईडी पर दोबारा भेज दीजिए, समायोजित हो जाएगा।',
          ),
          refuse: L(
            'Then the matter stays pending and you will have to come to the office yourself tomorrow.',
            'तो मामला लंबित रहेगा और कल आपको ख़ुद दफ़्तर आना पड़ेगा।',
          ),
        },
        endsRound: true,
      },
    ],
  },
};

export const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[];

export function isPersonaId(v: unknown): v is PersonaId {
  return typeof v === 'string' && v in PERSONAS;
}

/** Pick the persona that best practises a tactic found in Check. */
export function personaForTactic(tactic: TacticId): PersonaId {
  const match = PERSONA_IDS.find(
    (id) => id !== 'personalised' && PERSONAS[id].trainsFor.includes(tactic),
  );
  return match ?? 'bank_kyc';
}

/** The persona that leans hardest on a given lever, for adaptive sparring. */
export function personaForLever(lever: Lever): PersonaId {
  const scored = PERSONA_IDS.filter((id) => id !== 'personalised').map((id) => ({
    id,
    hits: PERSONAS[id].tactics.filter((tactic) => TACTIC_LEVER[tactic] === lever).length,
  }));

  scored.sort((a, b) => b.hits - a.hits);
  return scored[0]!.hits > 0 ? scored[0]!.id : 'bank_kyc';
}

/** Every lever a persona pushes, for the picker. */
export function personaLevers(id: PersonaId): Lever[] {
  return [...new Set(PERSONAS[id].tactics.map((tactic) => TACTIC_LEVER[tactic]))];
}

/**
 * Personalised persona templates, chosen by which facts the Post X-Ray found.
 * The facts themselves stay in memory and never leave the page.
 */
export type FactKind = 'school' | 'absence' | 'family' | 'location' | 'contact' | 'other';

export interface PersonalisedTemplate {
  key: 'school_fee' | 'courier_absence' | 'relative_trouble' | 'bank_kyc';
  opening: Localised;
  escalation: string[];
}

export const PERSONALISED_TEMPLATES: Record<
  PersonalisedTemplate['key'],
  PersonalisedTemplate
> = {
  school_fee: {
    key: 'school_fee',
    opening: L(
      'Good morning, this is the school accounts office. Your child’s fee payment failed in our system this term.',
      'नमस्ते, स्कूल अकाउंट्स ऑफ़िस से बोल रहे हैं। इस सत्र में आपके बच्चे की फ़ीस का भुगतान हमारे सिस्टम में विफल हो गया है।',
    ),
    escalation: [
      'Name the school detail visible in the post',
      'Claim the fee payment failed and the child’s name may be struck off',
      'Offer to fix it immediately over UPI',
      'Ask for an OTP to "confirm the reversal"',
    ],
  },
  courier_absence: {
    key: 'courier_absence',
    opening: L(
      'Hello, courier delivery here. I am at your gate with a parcel but the house is locked — you are travelling, correct?',
      'नमस्ते, कूरियर डिलीवरी से। मैं पार्सल लेकर आपके गेट पर हूँ, पर घर बंद है — आप बाहर गए हैं, सही?',
    ),
    escalation: [
      'Mention the travel or absence seen in the post',
      'Claim a parcel or a house problem needs handling today',
      'Ask for a small redelivery fee by UPI',
      'Ask for an OTP to "confirm the address"',
    ],
  },
  relative_trouble: {
    key: 'relative_trouble',
    opening: L(
      'Hello, is this the family? Your relative is with us and there is an urgent matter — please do not panic.',
      'नमस्ते, क्या यह परिवार से हैं? आपके रिश्तेदार हमारे पास हैं और एक ज़रूरी मामला है — घबराइए मत।',
    ),
    escalation: [
      'Name the family member seen in the post',
      'Claim an accident or police matter',
      'Insist the call stays connected and nobody else is called',
      'Ask for money immediately by UPI',
    ],
  },
  bank_kyc: {
    key: 'bank_kyc',
    opening: PERSONAS.bank_kyc.opening,
    escalation: PERSONAS.bank_kyc.escalation,
  },
};

export function pickPersonalisedTemplate(factKinds: FactKind[]): PersonalisedTemplate {
  if (factKinds.includes('school')) return PERSONALISED_TEMPLATES.school_fee;
  if (factKinds.includes('absence')) return PERSONALISED_TEMPLATES.courier_absence;
  if (factKinds.includes('family')) return PERSONALISED_TEMPLATES.relative_trouble;
  return PERSONALISED_TEMPLATES.bank_kyc;
}
