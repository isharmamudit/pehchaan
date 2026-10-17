/**
 * Privacy Check-up. 12 questions, 2 per area, scored 0 / 4 / 8 (max 96),
 * scaled to 100. Everything runs in the browser; nothing is sent anywhere.
 */

import type { Localised } from './tactics';

export type CheckupArea =
  | 'password_reuse'
  | 'two_step'
  | 'recovery'
  | 'profile_visibility'
  | 'location'
  | 'app_permissions';

export interface CheckupOption {
  label: Localised;
  score: 0 | 4 | 8;
}

export interface CheckupQuestion {
  id: string;
  area: CheckupArea;
  question: Localised;
  options: [CheckupOption, CheckupOption, CheckupOption];
}

const L = (en: string, hi: string): Localised => ({ en, hi });

export const CHECKUP_QUESTIONS: CheckupQuestion[] = [
  {
    id: 'pw_reuse',
    area: 'password_reuse',
    question: L(
      'Do you use the same password on more than one important account?',
      'क्या आप एक ही पासवर्ड एक से ज़्यादा ज़रूरी अकाउंट पर इस्तेमाल करते हैं?',
    ),
    options: [
      { label: L('Yes, on many', 'हाँ, कई पर'), score: 0 },
      { label: L('On a few', 'कुछ पर'), score: 4 },
      { label: L('Never', 'कभी नहीं'), score: 8 },
    ],
  },
  {
    id: 'pw_manager',
    area: 'password_reuse',
    question: L(
      'Do you use a password manager or unique passphrases?',
      'क्या आप पासवर्ड मैनेजर या हर जगह अलग पासफ़्रेज़ इस्तेमाल करते हैं?',
    ),
    options: [
      { label: L('No, I remember a few passwords', 'नहीं, कुछ पासवर्ड याद रखता/रखती हूँ'), score: 0 },
      { label: L('For some accounts', 'कुछ अकाउंट के लिए'), score: 4 },
      { label: L('Yes, for everything important', 'हाँ, हर ज़रूरी अकाउंट पर'), score: 8 },
    ],
  },
  {
    id: 'wa_two_step',
    area: 'two_step',
    question: L(
      'Is two-step verification switched on for WhatsApp?',
      'क्या व्हाट्सऐप पर टू-स्टेप वेरिफ़िकेशन चालू है?',
    ),
    options: [
      { label: L('No', 'नहीं'), score: 0 },
      { label: L('Not sure', 'पता नहीं'), score: 4 },
      { label: L('Yes', 'हाँ'), score: 8 },
    ],
  },
  {
    id: 'email_two_step',
    area: 'two_step',
    question: L(
      'Is 2-step verification on for your Google or email account?',
      'क्या आपके गूगल या ईमेल अकाउंट पर 2-स्टेप वेरिफ़िकेशन चालू है?',
    ),
    options: [
      { label: L('No', 'नहीं'), score: 0 },
      { label: L('Not sure', 'पता नहीं'), score: 4 },
      { label: L('Yes', 'हाँ'), score: 8 },
    ],
  },
  {
    id: 'recovery_details',
    area: 'recovery',
    question: L(
      'Are your recovery phone number and email up to date?',
      'क्या आपका रिकवरी फ़ोन नंबर और ईमेल अपडेटेड है?',
    ),
    options: [
      { label: L('No, they are old', 'नहीं, पुराने हैं'), score: 0 },
      { label: L('Not sure', 'पता नहीं'), score: 4 },
      { label: L('Yes, checked recently', 'हाँ, हाल ही में जाँचा है'), score: 8 },
    ],
  },
  {
    id: 'login_alerts',
    area: 'recovery',
    question: L(
      'Would you notice a login from a new device?',
      'क्या आपको पता चलेगा अगर किसी नए डिवाइस से लॉगिन हो?',
    ),
    options: [
      { label: L('No, alerts are off or ignored', 'नहीं, अलर्ट बंद हैं या देखता/देखती नहीं'), score: 0 },
      { label: L('Maybe', 'शायद'), score: 4 },
      { label: L('Yes, alerts are on', 'हाँ, अलर्ट चालू हैं'), score: 8 },
    ],
  },
  {
    id: 'insta_private',
    area: 'profile_visibility',
    question: L('Is your Instagram account private?', 'क्या आपका इंस्टाग्राम अकाउंट प्राइवेट है?'),
    options: [
      { label: L('No, it is public', 'नहीं, पब्लिक है'), score: 0 },
      { label: L('I do not use Instagram', 'मैं इंस्टाग्राम इस्तेमाल नहीं करता/करती'), score: 4 },
      { label: L('Yes, private', 'हाँ, प्राइवेट है'), score: 8 },
    ],
  },
  {
    id: 'wa_visibility',
    area: 'profile_visibility',
    question: L(
      'Who can see your phone number and profile photo on WhatsApp?',
      'व्हाट्सऐप पर आपका नंबर और प्रोफ़ाइल फ़ोटो कौन देख सकता है?',
    ),
    options: [
      { label: L('Everyone', 'सभी'), score: 0 },
      { label: L('Not sure', 'पता नहीं'), score: 4 },
      { label: L('My contacts only', 'सिर्फ़ मेरे संपर्क'), score: 8 },
    ],
  },
  {
    id: 'geotag_posts',
    area: 'location',
    question: L(
      'Do you post photos tagged with your location?',
      'क्या आप फ़ोटो अपनी लोकेशन टैग करके पोस्ट करते हैं?',
    ),
    options: [
      { label: L('Often', 'अक्सर'), score: 0 },
      { label: L('Sometimes', 'कभी-कभी'), score: 4 },
      { label: L('Never', 'कभी नहीं'), score: 8 },
    ],
  },
  {
    id: 'live_location',
    area: 'location',
    question: L(
      'Do you share live location with apps you do not use daily?',
      'क्या आप रोज़ इस्तेमाल न होने वाले ऐप्स को लाइव लोकेशन देते हैं?',
    ),
    options: [
      { label: L('Yes, several apps', 'हाँ, कई ऐप्स को'), score: 0 },
      { label: L('One or two', 'एक-दो को'), score: 4 },
      { label: L('No, only while using the app', 'नहीं, सिर्फ़ ऐप चलाते समय'), score: 8 },
    ],
  },
  {
    id: 'permission_review',
    area: 'app_permissions',
    question: L(
      'Have you checked which apps can use contacts, SMS or the microphone in the last 3 months?',
      'क्या पिछले 3 महीनों में देखा कि कौन से ऐप्स संपर्क, एसएमएस या माइक्रोफ़ोन इस्तेमाल कर सकते हैं?',
    ),
    options: [
      { label: L('Never checked', 'कभी नहीं देखा'), score: 0 },
      { label: L('Long ago', 'बहुत पहले'), score: 4 },
      { label: L('Yes, recently', 'हाँ, हाल ही में'), score: 8 },
    ],
  },
  {
    id: 'apk_installs',
    area: 'app_permissions',
    question: L(
      'Do you install apps from links sent in messages?',
      'क्या आप संदेशों में आए लिंक से ऐप इंस्टॉल करते हैं?',
    ),
    options: [
      { label: L('Yes, if it looks genuine', 'हाँ, अगर असली लगे'), score: 0 },
      { label: L('Rarely', 'कभी-कभार'), score: 4 },
      { label: L('Never, only from the official store', 'कभी नहीं, सिर्फ़ आधिकारिक स्टोर से'), score: 8 },
    ],
  },
];

export const MAX_RAW_SCORE = CHECKUP_QUESTIONS.length * 8; // 96

export interface CheckupAnswer {
  questionId: string;
  optionIndex: 0 | 1 | 2;
}

export interface ChecklistItem {
  area: CheckupArea;
  questionId: string;
  title: Localised;
  steps: Localised[];
  link?: { label: string; url: string };
}

/** Area fixes, worst answers first. Deliberately generic so they stay correct. */
const FIXES: Record<CheckupArea, Omit<ChecklistItem, 'questionId' | 'area'>> = {
  password_reuse: {
    title: L('Stop reusing passwords on important accounts', 'ज़रूरी अकाउंट पर एक ही पासवर्ड दोहराना बंद कीजिए'),
    steps: [
      L('Start with email and banking — if the email falls, everything else follows.', 'ईमेल और बैंकिंग से शुरू कीजिए — ईमेल गया तो बाक़ी सब चला जाता है।'),
      L('Use a passphrase of four unrelated words instead of one hard word.', 'एक कठिन शब्द की जगह चार असंबंधित शब्दों का पासफ़्रेज़ बनाइए।'),
      L('Use your phone’s built-in password manager so you do not have to remember them.', 'फ़ोन का अपना पासवर्ड मैनेजर इस्तेमाल कीजिए, ताकि याद रखना न पड़े।'),
      L('Change the reused password on your most important account today.', 'आज ही अपने सबसे ज़रूरी अकाउंट का दोहराया हुआ पासवर्ड बदलिए।'),
    ],
  },
  two_step: {
    title: L('Turn on two-step verification', 'टू-स्टेप वेरिफ़िकेशन चालू कीजिए'),
    steps: [
      L('WhatsApp: Settings → Account → Two-step verification → Turn on, then set a 6-digit PIN.', 'व्हाट्सऐप: सेटिंग्स → अकाउंट → टू-स्टेप वेरिफ़िकेशन → चालू कीजिए, फिर 6 अंकों का पिन सेट कीजिए।'),
      L('Add an email address there so you can reset the PIN if you forget it.', 'वहाँ ईमेल भी जोड़िए, ताकि पिन भूलने पर रीसेट कर सकें।'),
      L('Google: run the Security Check-up and switch on 2-Step Verification.', 'गूगल: सिक्योरिटी चेक-अप चलाइए और 2-स्टेप वेरिफ़िकेशन चालू कीजिए।'),
      L('Never share that PIN with anyone, including "support" staff.', 'वह पिन किसी को न बताएँ, "सपोर्ट" वालों को भी नहीं।'),
    ],
    link: { label: 'Google Security Check-up', url: 'https://myaccount.google.com/security-checkup' },
  },
  recovery: {
    title: L('Fix your recovery details and alerts', 'रिकवरी जानकारी और अलर्ट ठीक कीजिए'),
    steps: [
      L('Open your email account’s security settings and check the recovery phone and email.', 'ईमेल अकाउंट की सिक्योरिटी सेटिंग्स में रिकवरी फ़ोन और ईमेल जाँचिए।'),
      L('Remove old numbers you no longer own.', 'जो पुराने नंबर अब आपके नहीं हैं, उन्हें हटाइए।'),
      L('Turn on sign-in alerts so a new device login reaches you.', 'साइन-इन अलर्ट चालू कीजिए, ताकि नए डिवाइस का लॉगिन आपको पता चले।'),
      L('Review the list of devices signed in and sign out the ones you do not recognise.', 'लॉगिन डिवाइस की सूची देखिए और अनजान डिवाइस साइन-आउट कीजिए।'),
    ],
    link: { label: 'Google Security Check-up', url: 'https://myaccount.google.com/security-checkup' },
  },
  profile_visibility: {
    title: L('Reduce who can see your profile', 'अपनी प्रोफ़ाइल कौन देख सकता है, यह घटाइए'),
    steps: [
      L('Instagram: Settings → Account privacy → switch the account to private.', 'इंस्टाग्राम: सेटिंग्स → अकाउंट प्राइवेसी → अकाउंट प्राइवेट कीजिए।'),
      L('WhatsApp: Settings → Privacy → set Profile photo, About and Last seen to My contacts.', 'व्हाट्सऐप: सेटिंग्स → प्राइवेसी → प्रोफ़ाइल फ़ोटो, अबाउट और लास्ट सीन को "मेरे संपर्क" कीजिए।'),
      L('Remove your phone number and school or office name from public bios.', 'पब्लिक बायो से अपना फ़ोन नंबर और स्कूल या दफ़्तर का नाम हटाइए।'),
      L('Check what a logged-out stranger sees by opening your profile in a private window.', 'प्राइवेट विंडो में अपनी प्रोफ़ाइल खोलकर देखिए कि अजनबी को क्या दिखता है।'),
    ],
  },
  location: {
    title: L('Share less location', 'लोकेशन कम साझा कीजिए'),
    steps: [
      L('Turn off location tagging in your camera app before you take photos.', 'फ़ोटो लेने से पहले कैमरा ऐप में लोकेशन टैगिंग बंद कीजिए।'),
      L('Post holiday photos after you come back, not while the house is empty.', 'छुट्टी की फ़ोटो लौटने के बाद पोस्ट कीजिए, घर खाली रहते हुए नहीं।'),
      L('Android: Settings → Location → App permissions → set apps to "While using".', 'एंड्रॉयड: सेटिंग्स → लोकेशन → ऐप अनुमतियाँ → ऐप्स को "इस्तेमाल के दौरान" कीजिए।'),
      L('iPhone: Settings → Privacy & Security → Location Services → review each app.', 'आईफ़ोन: सेटिंग्स → प्राइवेसी और सिक्योरिटी → लोकेशन सर्विसेज़ → हर ऐप जाँचिए।'),
    ],
  },
  app_permissions: {
    title: L('Review app permissions and installs', 'ऐप अनुमतियाँ और इंस्टॉल जाँचिए'),
    steps: [
      L('Android: Settings → Security & privacy → Permission manager → check SMS, Contacts, Microphone.', 'एंड्रॉयड: सेटिंग्स → सिक्योरिटी और प्राइवेसी → परमिशन मैनेजर → एसएमएस, संपर्क, माइक्रोफ़ोन जाँचिए।'),
      L('iPhone: Settings → Privacy & Security → check Contacts and Microphone app by app.', 'आईफ़ोन: सेटिंग्स → प्राइवेसी और सिक्योरिटी → संपर्क और माइक्रोफ़ोन हर ऐप के लिए जाँचिए।'),
      L('Remove SMS access from every app that is not your messaging app.', 'जो आपका मैसेजिंग ऐप नहीं है, उससे एसएमएस की अनुमति हटाइए।'),
      L('Install apps only from the official store, never from a link in a message.', 'ऐप सिर्फ़ आधिकारिक स्टोर से इंस्टॉल कीजिए, संदेश के लिंक से कभी नहीं।'),
      L('Lock your Aadhaar biometrics on the official UIDAI website or mAadhaar app.', 'आधिकारिक यूआईडीएआई वेबसाइट या mAadhaar ऐप से अपनी आधार बायोमेट्रिक लॉक कीजिए।'),
    ],
    link: { label: 'UIDAI (official)', url: 'https://uidai.gov.in/' },
  },
};

export interface CheckupResult {
  raw: number;
  score: number; // 0–100
  checklist: ChecklistItem[];
  byArea: Record<CheckupArea, number>;
}

export function scoreCheckup(answers: CheckupAnswer[]): CheckupResult {
  const byId = new Map(CHECKUP_QUESTIONS.map((q) => [q.id, q]));
  const byArea = {} as Record<CheckupArea, number>;
  let raw = 0;

  const scored: Array<{ question: CheckupQuestion; score: number }> = [];

  for (const answer of answers) {
    const question = byId.get(answer.questionId);
    if (!question) continue;
    const option = question.options[answer.optionIndex];
    if (!option) continue;
    raw += option.score;
    byArea[question.area] = (byArea[question.area] ?? 0) + option.score;
    scored.push({ question, score: option.score });
  }

  // Worst answers first; one checklist item per area, strongest problem wins.
  const seenAreas = new Set<CheckupArea>();
  const checklist: ChecklistItem[] = [];
  for (const { question, score } of scored.sort((a, b) => a.score - b.score)) {
    if (score === 8) continue;
    if (seenAreas.has(question.area)) continue;
    seenAreas.add(question.area);
    checklist.push({
      area: question.area,
      questionId: question.id,
      ...FIXES[question.area],
    });
  }

  return {
    raw,
    score: Math.round((raw / MAX_RAW_SCORE) * 100),
    checklist,
    byArea,
  };
}
