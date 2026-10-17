/** "Do now" steps, chosen by verdict and input type. */

import type { InputType, Verdict } from '../core/types';
import type { Localised } from '../core/tactics';

const L = (en: string, hi: string): Localised => ({ en, hi });

export interface Step {
  text: Localised;
  href?: string;
  tel?: string;
}

const NEVER_REPLY = L(
  'Do not reply, do not call back, and do not open any link in it.',
  'जवाब मत दीजिए, वापस कॉल मत कीजिए, और इसका कोई लिंक मत खोलिए।',
);

const VERIFY_YOURSELF = L(
  'If it claims to be your bank or a government office, call the number printed on your card or on the official website — never a number from the message.',
  'अगर यह बैंक या सरकारी दफ़्तर का दावा करता है, तो कार्ड या आधिकारिक वेबसाइट पर लिखे नंबर पर कॉल कीजिए — संदेश में दिए नंबर पर कभी नहीं।',
);

const REPORT_CHAKSHU: Step = {
  text: L(
    'Report the call or SMS on Chakshu, on the Sanchar Saathi portal.',
    'संचार साथी पोर्टल पर चक्षु में इस कॉल या एसएमएस की रिपोर्ट कीजिए।',
  ),
  href: 'https://sancharsaathi.gov.in/sfc/',
};

const ALREADY_LOST: Step = {
  text: L(
    'If you already paid or shared an OTP, call 1930 now and open Get Help Now.',
    'अगर आपने पैसे भेज दिए या ओटीपी बता दिया, तो अभी 1930 पर कॉल कीजिए और "अभी मदद चाहिए" खोलिए।',
  ),
  tel: 'tel:1930',
};

const BLOCK_SENDER: Step = {
  text: L('Block the sender and tell one family member what happened.', 'भेजने वाले को ब्लॉक कीजिए और परिवार के एक सदस्य को बताइए।'),
};

export function doNowSteps(verdict: Verdict, inputType: InputType): Step[] {
  const steps: Step[] = [];

  if (verdict !== 'no_red_flags') {
    steps.push({ text: NEVER_REPLY });
  }

  if (inputType === 'qr') {
    steps.push({
      text: L(
        'Never scan a QR code to RECEIVE money. Receiving never needs your UPI PIN.',
        'पैसे लेने के लिए क्यूआर कभी स्कैन न करें। पैसे लेने में यूपीआई पिन कभी नहीं लगता।',
      ),
    });
  }

  if (inputType === 'url') {
    steps.push({
      text: L(
        'Type the official address into your browser yourself instead of opening this link.',
        'यह लिंक खोलने के बजाय आधिकारिक पता ख़ुद ब्राउज़र में टाइप कीजिए।',
      ),
    });
  }

  steps.push({ text: VERIFY_YOURSELF });

  if (verdict === 'likely_scam') {
    steps.push(REPORT_CHAKSHU, ALREADY_LOST);
  } else if (verdict === 'suspicious') {
    steps.push(REPORT_CHAKSHU);
  }

  steps.push(BLOCK_SENDER);
  return steps;
}

export const DO_NOW_TITLE = L('Do now', 'अभी यह कीजिए');
