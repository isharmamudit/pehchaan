/**
 * The guided demo: four acts, one Next button, nothing typed on stage.
 *
 * Narration is what the presenter says out loud. Everything shown beside it is
 * the real product running on real input — no mock-ups, no screenshots.
 */

import type { Localised } from './tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

export type ActId = 'message' | 'privacy' | 'photo' | 'scammer';

export interface Act {
  id: ActId;
  /** Roughly how long this beat should take, in seconds. */
  seconds: number;
  kicker: Localised;
  title: Localised;
  /** The line the presenter says while this act is on screen. */
  narration: Localised;
  /** The point this act exists to make. Shown small, for the presenter. */
  beat: Localised;
}

export const ACTS: Act[] = [
  {
    id: 'message',
    seconds: 40,
    kicker: L('Act one', 'पहला भाग'),
    title: L('A message your mother could get today', 'ऐसा संदेश जो आज आपकी माँ को आ सकता है'),
    narration: L(
      'This is a KYC SMS in Hinglish. We do not just call it a scam — we point at the exact words doing the work, name the tactic behind each one, and show what happens next if you reply.',
      'यह हिंग्लिश में केवाईसी एसएमएस है। हम इसे सिर्फ़ "ठगी" नहीं कहते — हम ठीक उन शब्दों पर उँगली रखते हैं, हर एक के पीछे की चाल का नाम बताते हैं, और दिखाते हैं कि जवाब दिया तो आगे क्या होगा।',
    ),
    beat: L(
      'Explain, don’t just judge. Every flag has a phrase, a tactic and an evidence badge.',
      'सिर्फ़ फ़ैसला नहीं, समझाना। हर चेतावनी के पीछे वाक्य, चाल और सबूत का बैज है।',
    ),
  },
  {
    id: 'privacy',
    seconds: 25,
    kicker: L('Act two', 'दूसरा भाग'),
    title: L('What actually left the device', 'डिवाइस से असल में क्या गया'),
    narration: L(
      'Every privacy tool claims to protect you. Here is ours proving it: this is the exact payload that goes to the server. The phone number, the account number, the OTP — all masked in the browser before a single byte leaves.',
      'हर प्राइवेसी टूल सुरक्षा का दावा करता है। यहाँ हमारा सबूत देता है: यही वह पेलोड है जो सर्वर को जाता है। फ़ोन नंबर, खाता नंबर, ओटीपी — सब ब्राउज़र में ही छिप जाते हैं, एक बाइट भेजने से पहले।',
    ),
    beat: L(
      'The rule engine already ran on the original text, so masking costs us no evidence.',
      'नियम इंजन असली टेक्स्ट पर पहले ही चल चुका है, इसलिए छिपाने से कोई सबूत नहीं जाता।',
    ),
  },
  {
    id: 'photo',
    seconds: 50,
    kicker: L('Act three', 'तीसरा भाग'),
    title: L('A holiday photo, about to be posted', 'छुट्टी की फ़ोटो, पोस्ट होने ही वाली है'),
    narration: L(
      'Nothing here looks dangerous. But read what a stranger now knows: which school the child goes to, and that the house is empty until Sunday. We find it on the device, before it is posted.',
      'यहाँ कुछ भी ख़तरनाक नहीं लगता। पर देखिए एक अजनबी अब क्या जानता है: बच्चा किस स्कूल में पढ़ता है, और घर रविवार तक खाली है। हम यह डिवाइस पर ही पकड़ लेते हैं, पोस्ट होने से पहले।',
    ),
    beat: L(
      'This is the setup for the only moment that really lands.',
      'यही उस इकलौते पल की तैयारी है जो असल में असर करता है।',
    ),
  },
  {
    id: 'scammer',
    seconds: 45,
    kicker: L('Act four', 'चौथा भाग'),
    title: L('Now meet the scammer built from that photo', 'अब मिलिए उस ठग से जो उसी फ़ोटो से बना है'),
    narration: L(
      'The caller already knows the school. That is what makes people believe it. Watch what happens when I give in — the app names the exact pressure I folded under, and the next round will come after that weakness.',
      'कॉल करने वाला स्कूल पहले से जानता है। इसी से लोग भरोसा कर लेते हैं। देखिए जब मैं झुक जाता हूँ तो क्या होता है — ऐप बताता है कि मैं किस दबाव में टूटा, और अगला राउंड उसी कमज़ोरी पर आएगा।',
    ),
    beat: L(
      'Check teaches. Sparring builds the reflex. The profile makes it personal.',
      'जाँच सिखाती है। अभ्यास आदत बनाता है। कुंडली उसे निजी बनाती है।',
    ),
  },
];

/**
 * The replies the presenter sends in act four, in order, so nothing is typed
 * on stage. The last one gives something away on purpose: the point of the
 * act is what the app does when you fold.
 */
export const SCRIPTED_REPLIES: Localised[] = [
  L('Who is this?', 'आप कौन बोल रहे हैं?'),
  L('How do you know which school my son goes to?', 'आपको कैसे पता कि मेरा बेटा किस स्कूल में पढ़ता है?'),
  L('Okay, I will pay the fee now. My Aadhaar is 2345 6789 0123', 'ठीक है, मैं अभी फ़ीस भर देता हूँ। मेरा आधार 2345 6789 0123 है'),
];

export const DEMO_UI = {
  start: L('Run the guided demo', 'निर्देशित डेमो चलाइए'),
  next: L('Next', 'आगे'),
  back: L('Back', 'पीछे'),
  exit: L('Exit demo', 'डेमो से बाहर'),
  presenter: L('Presenter note', 'प्रस्तुतकर्ता के लिए'),
  say: L('Say this', 'यह कहिए'),
  sendReply: L('Send the next reply', 'अगला जवाब भेजिए'),
  running: L('Running the real pipeline…', 'असली पाइपलाइन चल रही है…'),
  finished: L('That is the whole product, in four minutes.', 'यही है पूरा प्रोडक्ट, चार मिनट में।'),
  restart: L('Run it again', 'दोबारा चलाइए'),
  hint: L('Arrow keys or space to move between acts', 'भागों के बीच जाने के लिए ऐरो या स्पेस'),
};
