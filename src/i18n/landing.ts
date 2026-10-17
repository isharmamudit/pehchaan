/**
 * Landing page copy, English and Hindi side by side.
 * Same {en, hi} shape used by the tactic library and the help config.
 */

import type { Localised } from '../core/tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

export const landing = {
  nav: {
    brand: L('Pehchaan', 'पहचान'),
    help: L('Get Help Now', 'अभी मदद चाहिए'),
    helpShort: L('Help', 'मदद'),
    menu: L('Menu', 'मेन्यू'),
    close: L('Close', 'बंद करें'),
    langLabel: L('Switch to Hindi', 'Switch to English'),
    langShort: L('हिं', 'EN'),
  },

  preloader: {
    line: L('Loading the nine tactics', 'नौ चालें लोड हो रही हैं'),
  },

  hero: {
    tagline: L(
      'Scams, fake forwards and oversharing all run on the same nine pressure tactics. Learn to see the tactic and you are protected from scams you have never met.',
      'ठगी, नकली फ़ॉरवर्ड और ज़्यादा जानकारी देना — तीनों एक ही नौ दबाव-चालों पर चलते हैं। चाल पहचानना आ गया, तो अनजानी ठगी से भी बचाव हो जाता है।',
    ),
    scroll: L('Scroll to explore', 'देखने के लिए स्क्रॉल करें'),
    demoLabel: L('Live check', 'लाइव जाँच'),
    demoVerdict: L('Likely scam', 'संभावित ठगी'),
    demoCount: L('5 red flags · 4 rule matches', '5 चेतावनी संकेत · 4 नियम मिले'),
  },

  statement: {
    line1: L('Spot the tactic,', 'चाल पहचानिए,'),
    line2: L('stop the scam', 'ठगी रोकिए'),
    body: L(
      'Every warning points to the exact phrase and names the tactic behind it. Deterministic rules and official services run first; AI only explains what the rules already found, and it can never invent a phrase that is not in your message.',
      'हर चेतावनी ठीक उसी वाक्य पर उँगली रखती है और उसके पीछे की चाल का नाम बताती है। पहले पक्के नियम और आधिकारिक सेवाएँ चलती हैं; एआई सिर्फ़ मिली हुई बात समझाता है, और आपके संदेश में न मौजूद वाक्य कभी नहीं गढ़ सकता।',
    ),
    cta: L('How it works', 'यह कैसे काम करता है'),
  },

  band: {
    title: L('Paste anything suspicious', 'कोई भी संदिग्ध चीज़ चिपकाइए'),
    sub: L('A message, a link, a screenshot, a QR, or just describe the call', 'संदेश, लिंक, स्क्रीनशॉट, क्यूआर, या बस कॉल के बारे में बताइए'),
  },

  ways: {
    kicker: L('Three ways in', 'तीन रास्ते'),
    intro: L(
      'One idea, three habits: check what arrived, rehearse saying no, and see what you are giving away.',
      'एक विचार, तीन आदतें: जो आया उसे जाँचिए, "ना" कहने का अभ्यास कीजिए, और देखिए आप क्या दे बैठे हैं।',
    ),
    check: {
      tags: L('Message · Link · Screenshot · QR · Voice', 'संदेश · लिंक · स्क्रीनशॉट · क्यूआर · आवाज़'),
      title: L('Check', 'जाँचें'),
      body: L(
        'Paste it and see the exact phrases that are doing the manipulating, each tied to a named tactic and an evidence badge.',
        'चिपकाइए और देखिए कौन से वाक्य दबाव बना रहे हैं, हर एक चाल के नाम और सबूत के बैज के साथ।',
      ),
    },
    practise: {
      tags: L('Simulation · Scorecard · Debrief', 'सिम्युलेशन · स्कोरकार्ड · समीक्षा'),
      title: L('Practise', 'अभ्यास'),
      body: L(
        'Spar with a simulated scammer and get scored on what actually keeps people safe: spotting it, refusing, verifying, and leaving early.',
        'नकली ठग से अभ्यास कीजिए और उसी पर अंक पाइए जो असल में बचाता है: पहचानना, मना करना, जाँचना, और जल्दी निकल जाना।',
      ),
    },
    protect: {
      tags: L('Photo · Caption · Metadata', 'फ़ोटो · कैप्शन · मेटाडेटा'),
      title: L('Protect', 'बचाव'),
      body: L(
        'See what a photo and caption reveal, then face a scammer who uses exactly those details against you.',
        'देखिए फ़ोटो और कैप्शन क्या बता देते हैं, फिर उसी जानकारी से लैस ठग का सामना कीजिए।',
      ),
    },
    help: {
      tags: L('1930 · Chakshu · Your bank', '1930 · चक्षु · आपका बैंक'),
      title: L('Get help', 'मदद लें'),
      body: L(
        'If money already moved or an OTP was shared, the first hour matters most. Ordered steps, official numbers, no guesswork.',
        'अगर पैसे चले गए या ओटीपी बता दिया, तो पहला घंटा सबसे अहम है। क्रम से क़दम, आधिकारिक नंबर, कोई अंदाज़ा नहीं।',
      ),
    },
  },

  evidence: {
    line1: L('Evidence first.', 'पहले सबूत।'),
    line2: L('AI only explains.', 'एआई सिर्फ़ समझाता है।'),
    body: L(
      'Nothing you paste is stored. Phone numbers, Aadhaar, PAN, card and OTP values are masked in your browser before a single byte leaves the device, and no result ever tells you something is safe.',
      'आप जो चिपकाते हैं वह कहीं सेव नहीं होता। फ़ोन नंबर, आधार, पैन, कार्ड और ओटीपी आपके ब्राउज़र में ही छिप जाते हैं, उसके बाद ही कुछ भेजा जाता है — और कोई नतीजा यह नहीं कहता कि कुछ "सुरक्षित" है।',
    ),
    badges: {
      rule: L('Matched a pattern checked on your device', 'आपके डिवाइस पर जाँचे गए पैटर्न से मिला'),
      service: L('Checked against an external service', 'बाहरी सेवा से जाँचा गया'),
      source: L('Backed by a published fact-check', 'प्रकाशित फ़ैक्ट-चेक पर आधारित'),
      ai: L('Explained by AI, quote verified in your text', 'एआई ने समझाया, वाक्य आपके टेक्स्ट में जाँचा गया'),
    },
  },

  attacker: {
    kicker: L('The attacker’s view', 'हमलावर की नज़र'),
    line: L(
      'Step into their shoes and see what one photo gives away',
      'उनकी जगह खड़े होकर देखिए कि एक फ़ोटो क्या बता देती है',
    ),
    body: L(
      'A school badge, a house number, a caption that says the family is away until Sunday. Post X-Ray finds them, then builds a scammer who uses exactly those facts on you, and names each one in the debrief.',
      'स्कूल का बैज, मकान नंबर, और कैप्शन जो बता दे कि परिवार रविवार तक बाहर है। पोस्ट एक्स-रे इन्हें ढूँढता है, फिर इन्हीं बातों से लैस ठग आपसे बात करता है, और समीक्षा में हर बात का नाम लेता है।',
    ),
    facts: [
      L('Where your child studies', 'आपका बच्चा कहाँ पढ़ता है'),
      L('That your home is empty until Sunday', 'आपका घर रविवार तक खाली है'),
      L('Your house number', 'आपका मकान नंबर'),
      L('The road you live on', 'आप किस सड़क पर रहते हैं'),
    ],
  },

  tactics: {
    kicker: L('The nine tactics', 'नौ चालें'),
    line: L(
      'Learn these once and you are ahead of scams that have not been invented yet',
      'इन्हें एक बार सीख लीजिए और आप उन ठगियों से भी आगे हैं जो अभी बनी ही नहीं',
    ),
  },

  cta: {
    kicker: L('Ready to try it on something real?', 'कुछ असली पर आज़माने को तैयार हैं?'),
    line: L('Check it before you trust it', 'भरोसा करने से पहले जाँच लीजिए'),
    primary: L('Check a message', 'संदेश जाँचिए'),
    secondary: L('See the demo', 'डेमो देखिए'),
    scroll: L('Continue to scroll', 'स्क्रॉल करते रहिए'),
  },

  footer: {
    emergency: L('If money already moved', 'अगर पैसे जा चुके हैं'),
    call: L('Call 1930', '1930 पर कॉल कीजिए'),
    report: L('Report at cybercrime.gov.in', 'cybercrime.gov.in पर रिपोर्ट कीजिए'),
    chakshu: L('Report a call or SMS on Chakshu', 'चक्षु पर कॉल या एसएमएस की रिपोर्ट कीजिए'),
    product: L('Product', 'प्रोडक्ट'),
    promises: L('Privacy promises', 'प्राइवेसी के वादे'),
    promiseList: [
      L('Nothing you paste is stored, anywhere.', 'आप जो चिपकाते हैं वह कहीं सेव नहीं होता।'),
      L('Personal details are masked before anything is sent.', 'कुछ भेजने से पहले निजी जानकारी छिपा दी जाती है।'),
      L('No accounts, no tracking, no content in logs.', 'न अकाउंट, न ट्रैकिंग, न लॉग में कोई सामग्री।'),
    ],
    disclaimer: L(
      'Pehchaan cannot freeze accounts or recover money, and no tool catches everything. Always verify through an official channel yourself.',
      'पहचान न खाते रोक सकता है, न पैसे वापस दिला सकता है, और कोई भी टूल सब कुछ नहीं पकड़ता। हमेशा आधिकारिक माध्यम से ख़ुद जाँच कीजिए।',
    ),
    back: L('Back to top', 'ऊपर जाइए'),
    keepScrolling: L('Keep scrolling', 'स्क्रॉल करते रहिए'),
  },
} as const;

/** The scam SMS shown animating inside the hero card. Fictional. */
export const HERO_DEMO = {
  message: L(
    'Dear Customer, your account will be BLOCKED within 24 hrs. Complete KYC now and share the OTP sent to your number. - Bank KYC Executive',
    'प्रिय ग्राहक, आपका खाता 24 घंटे में बंद हो जाएगा। अभी केवाईसी पूरी कीजिए और आए हुए ओटीपी बता दीजिए। - बैंक केवाईसी एग्ज़ीक्यूटिव',
  ),
  flags: [
    {
      phrase: L('will be BLOCKED', 'खाता 24 घंटे में बंद'),
      tactic: L('Threats and fear', 'धमकी और डर'),
      badge: L('Rule', 'नियम'),
    },
    {
      phrase: L('within 24 hrs', 'अभी'),
      tactic: L('False urgency', 'झूठी जल्दबाज़ी'),
      badge: L('Rule', 'नियम'),
    },
    {
      phrase: L('share the OTP', 'ओटीपी बता दीजिए'),
      tactic: L('Asking for your secrets', 'गोपनीय जानकारी माँगना'),
      badge: L('Rule', 'नियम'),
    },
    {
      phrase: L('Bank KYC Executive', 'बैंक केवाईसी एग्ज़ीक्यूटिव'),
      tactic: L('Fake authority', 'नकली अधिकारी'),
      badge: L('Rule', 'नियम'),
    },
  ],
};
