/**
 * "What happens if you reply" — the next few steps this particular message is
 * set up to walk you through.
 *
 * Built from the tactics actually found, in the order these scripts really run,
 * so it is derived from evidence rather than written for one example. It
 * describes the scam's own playbook; it never predicts what will happen to you.
 */

import type { Localised, TacticId } from './tactics';
import type { Finding, InputType } from './types';

const L = (en: string, hi: string): Localised => ({ en, hi });

export interface TimelineStep {
  /** Which finding this step follows from, so the UI can tie them together. */
  tactic: TacticId | 'reply';
  when: Localised;
  what: Localised;
}

const OPENING: TimelineStep = {
  tactic: 'reply',
  when: L('You reply', 'आप जवाब देते हैं'),
  what: L(
    'Your number is confirmed as live and answering. It moves to a list that gets called again.',
    'आपका नंबर चालू और जवाब देने वाला मान लिया जाता है। वह ऐसी सूची में चला जाता है जिस पर दोबारा कॉल आती है।',
  ),
};

/** The order these scripts actually escalate in. */
const SEQUENCE: TacticId[] = [
  'fake_authority',
  'threat_fear',
  'false_urgency',
  'secrecy_isolation',
  'suspicious_link',
  'remote_access',
  'credential_request',
  'payment_request',
  'too_good_to_be_true',
];

const STEPS: Record<TacticId, TimelineStep> = {
  fake_authority: {
    tactic: 'fake_authority',
    when: L('Within a minute', 'एक मिनट के अंदर'),
    what: L(
      'They give a name, a badge or an employee code. None of it can be checked from your side, and that is the point.',
      'वे नाम, बैज या कर्मचारी कोड बताते हैं। आपकी तरफ़ से कुछ भी जाँचा नहीं जा सकता — यही उनका मक़सद है।',
    ),
  },
  threat_fear: {
    tactic: 'threat_fear',
    when: L('Next', 'उसके बाद'),
    what: L(
      'The threat gets specific and personal: your account, your case, your name. Fear is what stops you checking.',
      'धमकी ठोस और निजी हो जाती है: आपका खाता, आपका केस, आपका नाम। डर ही आपको जाँचने से रोकता है।',
    ),
  },
  false_urgency: {
    tactic: 'false_urgency',
    when: L('Immediately after', 'तुरंत बाद'),
    what: L(
      'A clock appears. Every real option you have — call the bank, ask family — takes longer than the deadline they invented.',
      'घड़ी शुरू हो जाती है। आपके सारे असली रास्ते — बैंक को कॉल, घरवालों से पूछना — उनकी बनाई समय-सीमा से ज़्यादा लंबे हैं।',
    ),
  },
  secrecy_isolation: {
    tactic: 'secrecy_isolation',
    when: L('Before anything is asked of you', 'कुछ माँगने से पहले'),
    what: L(
      'You are told to stay on the line and tell nobody. This is the step that keeps anyone from talking you out of it.',
      'कहा जाता है कि लाइन पर रहिए और किसी को मत बताइए। यही क़दम किसी को आपको रोकने नहीं देता।',
    ),
  },
  suspicious_link: {
    tactic: 'suspicious_link',
    when: L('Then', 'फिर'),
    what: L(
      'A link arrives that looks like the real site. Whatever you type into it goes straight to them.',
      'ऐसा लिंक आता है जो असली साइट जैसा दिखता है। उसमें जो भी टाइप करेंगे, सीधे उन तक जाएगा।',
    ),
  },
  remote_access: {
    tactic: 'remote_access',
    when: L('Then', 'फिर'),
    what: L(
      'You install an app so they can "help". They can now see your screen, including every OTP as it arrives.',
      'आप "मदद" के लिए ऐप इंस्टॉल करते हैं। अब वे आपकी स्क्रीन देख सकते हैं, हर आते हुए ओटीपी समेत।',
    ),
  },
  credential_request: {
    tactic: 'credential_request',
    when: L('The moment that costs you', 'यही वह पल है जहाँ नुकसान होता है'),
    what: L(
      'They ask for the code. Reading it out is what authorises the transaction — nothing else has to go wrong.',
      'वे कोड माँगते हैं। उसे बोल देना ही लेन-देन को मंज़ूरी देता है — और कुछ ग़लत होने की ज़रूरत नहीं।',
    ),
  },
  payment_request: {
    tactic: 'payment_request',
    when: L('The moment that costs you', 'यही वह पल है जहाँ नुकसान होता है'),
    what: L(
      'Money moves by UPI or transfer. Once it has gone it is very hard to get back, which is why the first hour matters.',
      'पैसे यूपीआई या ट्रांसफ़र से चले जाते हैं। जाने के बाद वापस आना बहुत मुश्किल है — इसीलिए पहला घंटा अहम है।',
    ),
  },
  too_good_to_be_true: {
    tactic: 'too_good_to_be_true',
    when: L('Afterwards', 'उसके बाद'),
    what: L(
      'The promised reward never arrives. Instead there is one more fee, one more step, one more reason to pay again.',
      'वादा किया इनाम कभी नहीं आता। उसकी जगह एक और फ़ीस, एक और क़दम, दोबारा भरने की एक और वजह आती है।',
    ),
  },
};

const CLOSING = L(
  'None of this needs you to be careless. It only needs you to stay on the call.',
  'इसके लिए आपका लापरवाह होना ज़रूरी नहीं। बस इतना काफ़ी है कि आप कॉल पर बने रहें।',
);

export function buildTimeline(findings: Finding[], inputType: InputType): TimelineStep[] {
  const present = new Set(findings.map((finding) => finding.tactic));
  const steps = SEQUENCE.filter((tactic) => present.has(tactic)).map((tactic) => STEPS[tactic]);

  if (!steps.length) return [];

  const opening: TimelineStep =
    inputType === 'qr'
      ? {
          tactic: 'reply',
          when: L('You scan it', 'आप इसे स्कैन करते हैं'),
          what: L(
            'Your UPI app opens a payment from you, not to you. Approving it sends your money.',
            'आपका यूपीआई ऐप आपसे भुगतान खोलता है, आपको नहीं। मंज़ूरी देते ही आपके पैसे चले जाते हैं।',
          ),
        }
      : OPENING;

  return [opening, ...steps];
}

export const TIMELINE_TITLE = L('What happens if you reply', 'जवाब दिया तो आगे क्या होगा');
export const TIMELINE_NOTE = CLOSING;
export const TIMELINE_CAVEAT = L(
  'This is the script this message follows, not a prediction about you.',
  'यह उस स्क्रिप्ट का ढाँचा है जिस पर यह संदेश चलता है, आपके बारे में कोई भविष्यवाणी नहीं।',
);
