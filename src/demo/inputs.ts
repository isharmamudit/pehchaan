/**
 * Demo mode. Every sample below is original and fictional: no real person,
 * no real phone number, no real domain, no real transaction.
 */

import type { InputType } from '../core/types';

export interface DemoInput {
  id: string;
  title: { en: string; hi: string };
  inputType: InputType;
  /** Pre-filled text for Check, or the caption for Post X-Ray. */
  text: string;
  /** Sample asset served from /public. */
  asset?: string;
  /** For the QR demo: the payload a scan would decode to. */
  qrPayload?: string;
  route: string;
}

export const DEMO_INPUTS: DemoInput[] = [
  {
    id: 'kyc_sms',
    title: { en: 'Bank KYC SMS (Hinglish)', hi: 'बैंक केवाईसी एसएमएस (हिंग्लिश)' },
    inputType: 'message',
    route: '/check',
    // Fictional throughout. The numbers are deliberately synthetic-looking but
    // in a real format, so the privacy shield visibly masks them in the demo.
    text: `Dear Customer, aapka account KYC pending hai. Account will be BLOCKED within 24 hrs.
Turant update karein: kyc-update-sbi.in/verify
Verification ke liye OTP 448213 share karein jo abhi aapke number 9000000012 par aaya hai.
Account no 10020030040 confirm karna zaroori hai, ya call karein 9000000077 par.
- Bank KYC Executive`,
  },
  {
    id: 'digital_arrest_call',
    title: {
      en: '"Digital arrest" call transcript (Hinglish)',
      hi: '"डिजिटल अरेस्ट" कॉल का विवरण (हिंग्लिश)',
    },
    inputType: 'voice_transcript',
    route: '/check',
    text: `Main CBI cyber cell se Inspector Sharma bol raha hoon. Aapke naam se ek parcel pakda gaya hai jisme illegal items hain.
Aapke naam par non-bailable warrant taiyar ho raha hai, giraftar ho sakte hain.
Call mat kaatiye, video call par rahiye aur kisi ko mat bataiye, ghar me bhi nahi.
Verification ke liye apna Aadhaar number bataiye aur clearance ke liye RBI safe account me paise transfer kijiye.`,
  },
  {
    id: 'currency_hoax',
    title: { en: 'Viral currency hoax forward', hi: 'वायरल नोट वाला फ़ॉरवर्ड' },
    inputType: 'claim_forward',
    route: '/check',
    text: `⚠️⚠️⚠️ URGENT NEWS FOR EVERYONE ⚠️⚠️⚠️
RBI HAS DECIDED THAT 500 RUPEE NOTES WILL BECOME INVALID FROM NEXT MONTH.
Government is hiding this from the public, media will not tell you.
Forward this to 10 groups before it is deleted. Share before it's removed!!!
WHO says the new notes will also have a tracking chip.`,
  },
  {
    id: 'post_xray_photo',
    title: { en: 'Family photo + caption', hi: 'परिवार की फ़ोटो + कैप्शन' },
    inputType: 'message',
    route: '/protect',
    asset: '/demo/sample-post.svg',
    text: 'Off to Goa with family till Sunday! Aarav finished his exams at Sunrise Public School 🎉',
  },
  {
    id: 'upi_qr',
    title: { en: 'UPI "receive money" QR', hi: 'यूपीआई "पैसे लेने" वाला क्यूआर' },
    inputType: 'qr',
    route: '/check',
    text: 'upi://pay?pa=winner.payout@okaxis&pn=Prize%20Payout%20Desk&am=4999&cu=INR&tn=Processing%20fee',
    qrPayload:
      'upi://pay?pa=winner.payout@okaxis&pn=Prize%20Payout%20Desk&am=4999&cu=INR&tn=Processing%20fee',
  },
];

export function demoInput(id: string): DemoInput | undefined {
  return DEMO_INPUTS.find((d) => d.id === id);
}

/** ?fast=1 skips consent dialogs, but only for demo inputs on /demo. */
export function fastMode(search: string): boolean {
  return new URLSearchParams(search).get('fast') === '1';
}
