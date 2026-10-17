/**
 * Server-side persona configuration for the sparring simulation.
 * Mirrors src/core/personas.ts; the client sends only an id, never a prompt.
 */

export const PERSONA_IDS = ['digital_arrest', 'bank_kyc', 'job_task', 'personalised'] as const;
export type PersonaId = (typeof PERSONA_IDS)[number];

export const TEMPLATE_KEYS = [
  'school_fee',
  'courier_absence',
  'relative_trouble',
  'bank_kyc',
] as const;
export type TemplateKey = (typeof TEMPLATE_KEYS)[number];

interface PersonaConfig {
  name: string;
  escalation: string[];
}

export const PERSONA_CONFIG: Record<PersonaId, PersonaConfig> = {
  digital_arrest: {
    name: 'Inspector Sharma, a man claiming to be from the CBI Cyber Cell',
    escalation: [
      'Claim a parcel sent in the user’s name was seized with illegal items',
      'Threaten a non-bailable warrant and arrest',
      'Insist the call stays connected and nobody at home is told',
      'Ask for an Aadhaar number for "verification"',
      'Demand a transfer to a government "safe account" for clearance',
    ],
  },
  bank_kyc: {
    name: 'a polite "KYC executive" claiming to call from the user’s bank',
    escalation: [
      'Warn that the account will be blocked within 24 hours over pending KYC',
      'Offer to complete the KYC on this call immediately',
      'Ask the user to install a screen-sharing app for "verification"',
      'Ask the user to read out the code that was just sent',
      'Blame the user for the delay if they hesitate',
    ],
  },
  job_task: {
    name: 'Neha, an "HR recruiter" from an online job portal',
    escalation: [
      'Promise Rs 3,000–5,000 a day for liking videos from home',
      'Send a small first payout so the offer feels real',
      'Introduce a "prepaid task" that needs a deposit first',
      'Claim a bigger deposit is needed to unlock the withdrawal',
      'Blame a "wrong task order" when the user asks for their money',
    ],
  },
  personalised: {
    name: 'a caller who already knows details from the user’s own social media post',
    escalation: [
      'Open with a detail taken from the post so the call feels genuine',
      'Add a small urgent problem connected to that detail',
      'Ask for a confirmation detail the user has not shared',
      'Ask for a payment or a code to "fix" the problem',
    ],
  },
};

export const TEMPLATE_CONFIG: Record<TemplateKey, PersonaConfig> = {
  school_fee: {
    name: 'a caller from the "school accounts office"',
    escalation: [
      'Name the school detail visible in the user’s post',
      'Claim this term’s fee payment failed in the school system',
      'Offer to fix it immediately over UPI',
      'Ask for a code to "confirm the reversal"',
    ],
  },
  courier_absence: {
    name: 'a "courier delivery agent" standing at the user’s locked gate',
    escalation: [
      'Mention the travel or absence seen in the user’s post',
      'Claim a parcel or a house problem needs handling today',
      'Ask for a small redelivery fee by UPI',
      'Ask for a code to "confirm the address"',
    ],
  },
  relative_trouble: {
    name: 'a stranger claiming a relative of the user is in trouble',
    escalation: [
      'Name the family member seen in the user’s post',
      'Claim an accident or a police matter',
      'Insist the call stays connected and nobody else is called',
      'Ask for money immediately by UPI',
    ],
  },
  bank_kyc: PERSONA_CONFIG.bank_kyc,
};

export function resolvePersona(personaId: PersonaId, template?: TemplateKey): PersonaConfig {
  if (personaId === 'personalised' && template) return TEMPLATE_CONFIG[template];
  return PERSONA_CONFIG[personaId];
}
