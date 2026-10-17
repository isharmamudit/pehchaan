/**
 * Spot-the-scam quiz. Two sets of five, used as a before/after test.
 * Every item is original and fictional: no real names, numbers or links.
 */

import type { TacticId } from '../core/tactics';

export type QuizAnswer = 'scam' | 'legit' | 'not_sure';

export interface QuizItem {
  id: string;
  set: 'a' | 'b';
  text: { en: string; hi: string };
  answer: 'scam' | 'legit';
  tactics: TacticId[];
  explanation: { en: string; hi: string };
}

export const QUIZ_ITEMS: QuizItem[] = [
  // ------------------------------------------------------------------ set A
  {
    id: 'a1',
    set: 'a',
    text: {
      en: 'Dear Customer, your account will be BLOCKED within 24 hrs. Complete KYC now: kyc-verify-online.in/update',
      hi: 'प्रिय ग्राहक, आपका खाता 24 घंटे में बंद कर दिया जाएगा। अभी केवाईसी पूरी करें: kyc-verify-online.in/update',
    },
    answer: 'scam',
    tactics: ['false_urgency', 'threat_fear', 'suspicious_link'],
    explanation: {
      en: 'A deadline, a blocked-account threat and a link that only looks like a bank. Banks do not do KYC by SMS link.',
      hi: 'समय-सीमा, खाता बंद होने की धमकी और बैंक जैसा दिखने वाला लिंक। बैंक एसएमएस लिंक से केवाईसी नहीं कराते।',
    },
  },
  {
    id: 'a2',
    set: 'a',
    text: {
      en: 'Rs 2,480.00 debited from A/c XX4417 on 12-03 to SWIGGY. Not you? Call the number on your card. -Your Bank',
      hi: 'खाता XX4417 से 12-03 को SWIGGY को 2,480.00 रुपये डेबिट हुए। आपने नहीं किया? कार्ड पर लिखे नंबर पर कॉल करें। -आपका बैंक',
    },
    answer: 'legit',
    tactics: [],
    explanation: {
      en: 'A normal debit alert: it reports something that happened, asks for nothing, and points you to the number on your own card.',
      hi: 'सामान्य डेबिट अलर्ट: यह हुई बात बताता है, कुछ माँगता नहीं, और आपके अपने कार्ड के नंबर पर भेजता है।',
    },
  },
  {
    id: 'a3',
    set: 'a',
    text: {
      en: 'Sir I am from the cyber cell. A parcel in your name has drugs. Stay on video call, do not tell your family, and keep your Aadhaar ready.',
      hi: 'सर, मैं साइबर सेल से हूँ। आपके नाम के पार्सल में ड्रग्स मिले हैं। वीडियो कॉल पर रहिए, परिवार को मत बताइए, और आधार तैयार रखिए।',
    },
    answer: 'scam',
    tactics: ['fake_authority', 'threat_fear', 'secrecy_isolation', 'credential_request'],
    explanation: {
      en: 'No agency investigates by video call, and no real officer tells you to hide it from your family.',
      hi: 'कोई एजेंसी वीडियो कॉल पर जाँच नहीं करती, और कोई असली अधिकारी परिवार से छिपाने को नहीं कहता।',
    },
  },
  {
    id: 'a4',
    set: 'a',
    text: {
      en: 'Your order #84412 is out for delivery today between 2 PM and 6 PM. Track it in the app.',
      hi: 'आपका ऑर्डर #84412 आज दोपहर 2 से शाम 6 बजे के बीच डिलीवरी के लिए निकल चुका है। ऐप में ट्रैक कीजिए।',
    },
    answer: 'legit',
    tactics: [],
    explanation: {
      en: 'An ordinary delivery update. It asks for no money, no code, and sends you to the app you already have.',
      hi: 'सामान्य डिलीवरी अपडेट। न पैसे माँगे, न कोड, और आपको उसी ऐप पर भेजा जो आपके पास पहले से है।',
    },
  },
  {
    id: 'a5',
    set: 'a',
    text: {
      en: 'Congratulations! You won a Rs 25,00,000 lucky draw. Pay a refundable processing fee of Rs 4,999 to release the prize today.',
      hi: 'बधाई हो! आपने 25,00,000 रुपये का लकी ड्रॉ जीता है। इनाम आज ही छुड़ाने के लिए 4,999 रुपये की वापसी-योग्य प्रोसेसिंग फ़ीस भरें।',
    },
    answer: 'scam',
    tactics: ['too_good_to_be_true', 'payment_request', 'false_urgency'],
    explanation: {
      en: 'You cannot win a draw you never entered, and no real prize needs a fee from you first.',
      hi: 'जिस ड्रॉ में आपने भाग ही नहीं लिया, वह आप जीत नहीं सकते, और किसी असली इनाम के लिए पहले फ़ीस नहीं लगती।',
    },
  },

  // ------------------------------------------------------------------ set B
  {
    id: 'b1',
    set: 'b',
    text: {
      en: 'Hi, this is from your bank. To stop the block, install QuickSupport so I can guide your screen, then tell me the code you receive.',
      hi: 'नमस्ते, आपके बैंक से बोल रहे हैं। खाता बंद होने से रोकने के लिए QuickSupport इंस्टॉल कीजिए, ताकि मैं स्क्रीन पर मदद कर सकूँ, फिर जो कोड आए वह बता दीजिए।',
    },
    answer: 'scam',
    tactics: ['remote_access', 'credential_request', 'fake_authority'],
    explanation: {
      en: 'Screen sharing plus a code request is the clearest scam combination there is.',
      hi: 'स्क्रीन शेयर और कोड माँगना — यह ठगी का सबसे साफ़ मेल है।',
    },
  },
  {
    id: 'b2',
    set: 'b',
    text: {
      en: 'Reminder: your electricity bill of Rs 1,340 is due on 20th. Pay through the board’s official app or website.',
      hi: 'याद दिलाना: आपका 1,340 रुपये का बिजली बिल 20 तारीख़ को देय है। बोर्ड के आधिकारिक ऐप या वेबसाइट से भुगतान कीजिए।',
    },
    answer: 'legit',
    tactics: [],
    explanation: {
      en: 'A due-date reminder with no threat, no link and no deadline tonight. The scam version says your power will be cut in two hours.',
      hi: 'देय तारीख़ की याद, कोई धमकी नहीं, कोई लिंक नहीं, आज रात की कोई समय-सीमा नहीं। ठगी वाला कहता है कि दो घंटे में बिजली कट जाएगी।',
    },
  },
  {
    id: 'b3',
    set: 'b',
    text: {
      en: 'URGENT: Electricity will be disconnected tonight at 9:30 PM as your previous bill was not updated. Call this officer immediately.',
      hi: 'ज़रूरी: पिछला बिल अपडेट न होने के कारण आज रात 9:30 बजे बिजली काट दी जाएगी। तुरंत इस अधिकारी को कॉल कीजिए।',
    },
    answer: 'scam',
    tactics: ['false_urgency', 'threat_fear', 'fake_authority'],
    explanation: {
      en: 'A tonight deadline plus a personal "officer" number. Boards disconnect through notices, not by SMS at short notice.',
      hi: 'आज रात की समय-सीमा और एक निजी "अधिकारी" का नंबर। बोर्ड नोटिस से काटते हैं, अचानक एसएमएस से नहीं।',
    },
  },
  {
    id: 'b4',
    set: 'b',
    text: {
      en: 'Part-time job: like 20 videos a day, earn Rs 4,000 daily. First task free, then a small refundable deposit unlocks your earnings.',
      hi: 'पार्ट-टाइम काम: रोज़ 20 वीडियो लाइक कीजिए, रोज़ 4,000 रुपये कमाइए। पहला टास्क मुफ़्त, फिर छोटी वापसी-योग्य जमा राशि से कमाई खुल जाएगी।',
    },
    answer: 'scam',
    tactics: ['too_good_to_be_true', 'payment_request'],
    explanation: {
      en: 'No real job asks you to pay to get paid. The free first task exists to make the deposit feel safe.',
      hi: 'कोई असली नौकरी पैसे पाने के लिए पैसे नहीं माँगती। मुफ़्त पहला टास्क सिर्फ़ जमा राशि सुरक्षित दिखाने के लिए है।',
    },
  },
  {
    id: 'b5',
    set: 'b',
    text: {
      en: 'Your OTP for login is 448213. Do not share it with anyone, including bank staff. -Your Bank',
      hi: 'लॉगिन के लिए आपका ओटीपी 448213 है। इसे किसी को न बताएँ, बैंक कर्मचारी को भी नहीं। -आपका बैंक',
    },
    answer: 'legit',
    tactics: [],
    explanation: {
      en: 'This is the bank sending you a code and warning you not to share it. The scam is the call that follows asking for it.',
      hi: 'यह बैंक आपको कोड भेज रहा है और न बताने की चेतावनी दे रहा है। ठगी वह कॉल है जो बाद में यही कोड माँगती है।',
    },
  },
];

export function quizSet(set: 'a' | 'b'): QuizItem[] {
  return QUIZ_ITEMS.filter((i) => i.set === set);
}

export function gradeQuiz(
  set: 'a' | 'b',
  answers: Record<string, QuizAnswer>,
): { correct: number; total: number; perItem: Array<{ itemId: string; answer: QuizAnswer; correct: boolean }> } {
  const items = quizSet(set);
  const perItem = items.map((item) => {
    const answer = answers[item.id] ?? 'not_sure';
    return { itemId: item.id, answer, correct: answer === item.answer };
  });
  return {
    correct: perItem.filter((p) => p.correct).length,
    total: items.length,
    perItem,
  };
}
