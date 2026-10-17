/**
 * Get Help Now. Every number and link lives here so it can be verified
 * before shipping. Verified 2026-10-16.
 */

import type { Localised } from '../core/tactics';

export const HELPLINES = {
  cyberFraud: { label: '1930', tel: 'tel:1930' },
  cyberPortal: 'https://cybercrime.gov.in/',
  chakshu: 'https://sancharsaathi.gov.in/sfc/',
  sancharSaathi: 'https://sancharsaathi.gov.in/',
  womenHelpline: { label: '181', tel: 'tel:181' },
  policeEmergency: { label: '112', tel: 'tel:112' },
} as const;

export type SituationId =
  | 'money_lost'
  | 'shared_otp_or_app'
  | 'suspicious_no_loss'
  | 'account_hacked'
  | 'posted_something';

export interface HelpStep {
  text: Localised;
  /** Optional action attached to the step. */
  href?: string;
  tel?: string;
}

export interface Situation {
  id: SituationId;
  title: Localised;
  urgency: 'high' | 'medium';
  steps: HelpStep[];
}

const L = (en: string, hi: string): Localised => ({ en, hi });

export const SITUATIONS: Situation[] = [
  {
    id: 'money_lost',
    title: L('I paid, or money left my account', 'मैंने पैसे भेज दिए, या खाते से पैसे चले गए'),
    urgency: 'high',
    steps: [
      {
        text: L(
          'Call 1930 now. The first few hours decide whether the money can be frozen.',
          'अभी 1930 पर कॉल कीजिए। पहले कुछ घंटे ही तय करते हैं कि पैसे रोके जा सकेंगे या नहीं।',
        ),
        tel: HELPLINES.cyberFraud.tel,
      },
      {
        text: L(
          'File a complaint on the National Cyber Crime Reporting Portal.',
          'राष्ट्रीय साइबर क्राइम रिपोर्टिंग पोर्टल पर शिकायत दर्ज कीजिए।',
        ),
        href: HELPLINES.cyberPortal,
      },
      {
        text: L(
          'Call your bank on the number printed on your card or passbook and block the card and UPI.',
          'अपने कार्ड या पासबुक पर लिखे नंबर पर बैंक को कॉल कीजिए और कार्ड व यूपीआई ब्लॉक कराइए।',
        ),
      },
      {
        text: L(
          'Save transaction IDs, screenshots, the caller’s number and the exact times.',
          'ट्रांज़ैक्शन आईडी, स्क्रीनशॉट, कॉल करने वाले का नंबर और सही समय संभालकर रखिए।',
        ),
      },
    ],
  },
  {
    id: 'shared_otp_or_app',
    title: L(
      'I shared an OTP or PIN, or installed a screen-share app',
      'मैंने ओटीपी या पिन बता दिया, या स्क्रीन-शेयर ऐप इंस्टॉल कर लिया',
    ),
    urgency: 'high',
    steps: [
      {
        text: L(
          'Turn on aeroplane mode and uninstall the app (AnyDesk, TeamViewer, QuickSupport or similar) right away.',
          'तुरंत एरोप्लेन मोड चालू कीजिए और वह ऐप (AnyDesk, TeamViewer, QuickSupport आदि) अनइंस्टॉल कीजिए।',
        ),
      },
      {
        text: L(
          'Call your bank from another phone and ask them to freeze online transactions.',
          'दूसरे फ़ोन से बैंक को कॉल कीजिए और ऑनलाइन लेन-देन रुकवाइए।',
        ),
      },
      {
        text: L(
          'Change your UPI PIN, net-banking password and email password from a device you trust.',
          'भरोसेमंद डिवाइस से अपना यूपीआई पिन, नेट-बैंकिंग पासवर्ड और ईमेल पासवर्ड बदलिए।',
        ),
      },
      {
        text: L(
          'If any money has moved, call 1930 and follow the steps above.',
          'अगर कोई रक़म निकली है, तो 1930 पर कॉल कीजिए और ऊपर के क़दम उठाइए।',
        ),
        tel: HELPLINES.cyberFraud.tel,
      },
    ],
  },
  {
    id: 'suspicious_no_loss',
    title: L(
      'A suspicious call or message, but I lost nothing',
      'संदिग्ध कॉल या संदेश, पर कोई नुकसान नहीं हुआ',
    ),
    urgency: 'medium',
    steps: [
      {
        text: L(
          'Do not reply, do not call back, do not open the link.',
          'जवाब मत दीजिए, वापस कॉल मत कीजिए, लिंक मत खोलिए।',
        ),
      },
      {
        text: L(
          'Report the call or SMS on Chakshu, on the Sanchar Saathi portal.',
          'संचार साथी पोर्टल पर चक्षु में उस कॉल या एसएमएस की रिपोर्ट कीजिए।',
        ),
        href: HELPLINES.chakshu,
      },
      {
        text: L(
          'Block the number and tell one family member what happened.',
          'नंबर ब्लॉक कीजिए और परिवार के एक सदस्य को बताइए कि क्या हुआ।',
        ),
      },
    ],
  },
  {
    id: 'account_hacked',
    title: L('My account was hacked', 'मेरा अकाउंट हैक हो गया'),
    urgency: 'high',
    steps: [
      {
        text: L(
          'Use the official recovery page of that service, reached by typing the address yourself.',
          'उस सेवा का आधिकारिक रिकवरी पेज खोलिए, पता ख़ुद टाइप करके।',
        ),
        href: 'https://support.google.com/accounts/answer/7299973',
      },
      {
        text: L(
          'Turn on two-step verification once you are back in.',
          'वापस लॉगिन होते ही टू-स्टेप वेरिफ़िकेशन चालू कीजिए।',
        ),
      },
      {
        text: L(
          'Warn your contacts that messages sent from your account may be fake.',
          'अपने संपर्कों को बताइए कि आपके अकाउंट से आए संदेश नकली हो सकते हैं।',
        ),
      },
      {
        text: L(
          'Report the impersonation on the cybercrime portal if money was asked from your contacts.',
          'अगर आपके संपर्कों से पैसे माँगे गए हैं, तो साइबर क्राइम पोर्टल पर रिपोर्ट कीजिए।',
        ),
        href: HELPLINES.cyberPortal,
      },
    ],
  },
  {
    id: 'posted_something',
    title: L('I posted something revealing', 'मैंने कुछ ऐसा पोस्ट कर दिया जिससे जानकारी खुल गई'),
    urgency: 'medium',
    steps: [
      {
        text: L(
          'Delete or edit the post first. Copies may already exist, so act on the rest too.',
          'पहले पोस्ट हटाइए या बदलिए। कॉपी बन चुकी हो सकती है, इसलिए बाक़ी क़दम भी उठाइए।',
        ),
      },
      {
        text: L(
          'Make the account private and check who can see your phone number and photo.',
          'अकाउंट प्राइवेट कीजिए और देखिए कि आपका नंबर और फ़ोटो कौन देख सकता है।',
        ),
      },
      {
        text: L(
          'Tell the people shown in the post, especially if a child’s school is visible.',
          'पोस्ट में दिख रहे लोगों को बताइए, ख़ासकर अगर बच्चे का स्कूल दिख रहा हो।',
        ),
      },
      {
        text: L(
          'If someone is impersonating you, report it on the cybercrime portal.',
          'अगर कोई आपके नाम से नकली पहचान बना रहा है, तो साइबर क्राइम पोर्टल पर रिपोर्ट कीजिए।',
        ),
        href: HELPLINES.cyberPortal,
      },
    ],
  },
];

export const HELP_FOOTER: Localised = L(
  'Pehchaan cannot freeze accounts or recover money. Contact the official channels above.',
  'पहचान न खाते रोक सकता है, न पैसे वापस दिला सकता है। ऊपर दिए आधिकारिक माध्यमों से संपर्क कीजिए।',
);

/** Suggested situation for a Check result, so "Get Help Now" opens the right one. */
export function situationForVerdict(
  hasPaid: boolean,
  sharedCredential: boolean,
): SituationId {
  if (hasPaid) return 'money_lost';
  if (sharedCredential) return 'shared_otp_or_app';
  return 'suspicious_no_loss';
}
