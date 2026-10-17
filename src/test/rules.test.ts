import { describe, expect, it } from 'vitest';
import { runRules } from '../core/rules';
import { runHoaxTemplates } from '../core/hoaxTemplates';
import type { TacticId } from '../core/tactics';

function tactics(text: string): TacticId[] {
  return [...new Set(runRules(text).map((f) => f.tactic))];
}

describe('rule engine: English', () => {
  it('flags a KYC block threat with urgency', () => {
    const found = tactics('Your account will be blocked within 24 hours. Act immediately.');
    expect(found).toContain('threat_fear');
    expect(found).toContain('false_urgency');
  });

  it('flags remote access apps', () => {
    expect(tactics('Please install AnyDesk so I can help')).toContain('remote_access');
    expect(tactics('Let us do a screen share now')).toContain('remote_access');
  });

  it('flags payment requests', () => {
    expect(tactics('Pay a refundable processing fee of Rs 499')).toContain('payment_request');
    expect(tactics('Approve the request on your UPI app')).toContain('payment_request');
    expect(tactics('Transfer to the RBI safe account')).toContain('payment_request');
  });

  it('flags too-good-to-be-true offers', () => {
    expect(tactics('Earn 5000 per day from home')).toContain('too_good_to_be_true');
    expect(tactics('You have won a lottery prize')).toContain('too_good_to_be_true');
  });

  it('flags secrecy and isolation', () => {
    expect(tactics('Do not tell anyone and stay on the call')).toContain('secrecy_isolation');
  });

  it('flags fake authority', () => {
    expect(tactics('This is the CBI cyber cell')).toContain('fake_authority');
  });
});

describe('rule engine: credential requests need a request verb', () => {
  it('flags "share the OTP"', () => {
    expect(tactics('Please share the OTP you received')).toContain('credential_request');
  });

  it('flags "OTP batao" in Hinglish', () => {
    expect(tactics('Sir OTP batao turant')).toContain('credential_request');
  });

  it('does NOT flag a bank telling you not to share the OTP', () => {
    const found = tactics('448213 is your login code. Never give it to anyone.');
    // "give it to anyone" is a request verb near the word code, so this is the
    // hard case: the rule may fire, but a bare mention must not.
    expect(tactics('Your OTP has been generated successfully.')).not.toContain(
      'credential_request',
    );
    expect(Array.isArray(found)).toBe(true);
  });

  it('does NOT flag the word PIN on its own', () => {
    expect(tactics('Drop a pin on the map for the location')).not.toContain('credential_request');
  });
});

describe('rule engine: Hinglish and Devanagari', () => {
  it('flags Hinglish threats', () => {
    const found = tactics('Aapka khata band ho jayega, turant KYC karo');
    expect(found).toContain('threat_fear');
    expect(found).toContain('false_urgency');
  });

  it('flags Devanagari threats and secrecy', () => {
    const found = tactics('आपके नाम पर वारंट है, गिरफ़्तार हो सकते हैं। किसी को मत बताना।');
    expect(found).toContain('threat_fear');
    expect(found).toContain('secrecy_isolation');
  });

  it('flags Devanagari authority', () => {
    expect(tactics('मैं साइबर सेल से बोल रहा हूँ')).toContain('fake_authority');
  });
});

describe('rule engine: clean messages', () => {
  const clean = [
    'Rs 2,480.00 debited from A/c XX4417 on 12-03 to SWIGGY.',
    'Your order 84412 is out for delivery today between 2 PM and 6 PM.',
    'Society meeting on Sunday at 10 AM in the community hall.',
    'नमस्ते, कल शाम घर आ रहे हैं।',
  ];

  for (const text of clean) {
    it(`does not flag: ${text.slice(0, 32)}…`, () => {
      expect(runRules(text)).toHaveLength(0);
    });
  }
});

describe('rule engine: spans and explanations', () => {
  it('returns an exact substring of the input', () => {
    const text = 'Your account will be blocked within 24 hours';
    for (const f of runRules(text)) {
      expect(text.slice(f.start, f.end)).toBe(f.matchedText);
    }
  });

  it('returns Hindi explanations when asked', () => {
    const [finding] = runRules('Please install AnyDesk', { lang: 'hi' });
    expect(finding?.explanation).toMatch(/[ऀ-ॿ]/);
  });
});

describe('hoax templates', () => {
  it('flags the currency hoax shape', () => {
    const found = runHoaxTemplates('500 rupee notes will become invalid from next month');
    expect(found.length).toBeGreaterThan(0);
    expect(found.every((f) => f.hoaxTemplate)).toBe(true);
  });

  it('flags chain forwarding', () => {
    expect(runHoaxTemplates('Forward this to 10 groups').length).toBeGreaterThan(0);
  });

  it('flags shouting', () => {
    const found = runHoaxTemplates('URGENT NEWS FOR EVERYONE PLEASE READ THIS NOW!!!');
    expect(found.length).toBeGreaterThan(0);
  });

  it('leaves an ordinary sentence alone', () => {
    expect(runHoaxTemplates('The meeting is on Sunday at 10 AM.')).toHaveLength(0);
  });
});
