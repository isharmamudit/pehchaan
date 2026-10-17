/**
 * Official places to verify a claim. One file so every URL can be checked
 * before shipping. Verified 2026-10-16.
 */

import type { ClaimTopic } from '../core/types';

export interface OfficialSource {
  name: { en: string; hi: string };
  url: string;
  what: { en: string; hi: string };
}

export const OFFICIAL_SOURCES: Record<ClaimTopic, OfficialSource> = {
  banking_currency: {
    name: { en: 'Reserve Bank of India', hi: 'भारतीय रिज़र्व बैंक' },
    url: 'https://www.rbi.org.in/Scripts/BS_PressReleaseDisplay.aspx',
    what: {
      en: 'RBI press releases are the only source for currency and banking rules.',
      hi: 'नोट और बैंकिंग नियमों की जानकारी सिर्फ़ आरबीआई की प्रेस विज्ञप्ति से मिलती है।',
    },
  },
  government_scheme: {
    name: { en: 'PIB Fact Check', hi: 'पीआईबी फ़ैक्ट चेक' },
    url: 'https://factcheck.pib.gov.in/',
    what: {
      en: 'PIB Fact Check lists fake government scheme messages.',
      hi: 'पीआईबी फ़ैक्ट चेक नकली सरकारी योजना संदेशों की सूची देता है।',
    },
  },
  elections: {
    name: { en: 'Election Commission of India', hi: 'भारत निर्वाचन आयोग' },
    url: 'https://www.eci.gov.in/',
    what: {
      en: 'Only the ECI announces anything about elections and voter rolls.',
      hi: 'चुनाव और मतदाता सूची की घोषणा सिर्फ़ निर्वाचन आयोग करता है।',
    },
  },
  health: {
    name: { en: 'Ministry of Health and Family Welfare', hi: 'स्वास्थ्य एवं परिवार कल्याण मंत्रालय' },
    url: 'https://www.mohfw.gov.in/',
    what: {
      en: 'Health advisories come from the Ministry, not from forwards.',
      hi: 'स्वास्थ्य सलाह मंत्रालय से आती है, फ़ॉरवर्ड से नहीं।',
    },
  },
  other: {
    name: { en: 'A trusted news source', hi: 'भरोसेमंद समाचार स्रोत' },
    url: 'https://www.google.com/search?q=fact+check',
    what: {
      en: 'Search a trusted news source. Do not forward until you have verified it.',
      hi: 'किसी भरोसेमंद समाचार स्रोत पर खोजें। जाँच से पहले आगे न भेजें।',
    },
  },
};
