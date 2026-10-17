/** responseSchema definitions for every structured Gemini call. */

import { TACTIC_IDS } from './validate.ts';

const TACTIC_ENUM = [...TACTIC_IDS];

export const ANALYZE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    input_type: {
      type: 'STRING',
      enum: ['message', 'url', 'claim_forward', 'screenshot', 'voice_transcript', 'qr'],
    },
    language: { type: 'STRING', enum: ['en', 'hi', 'hinglish'] },
    findings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          tactic: { type: 'STRING', enum: TACTIC_ENUM },
          explanation: { type: 'STRING' },
        },
        required: ['text', 'tactic', 'explanation'],
      },
    },
    claims: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          kind: {
            type: 'STRING',
            enum: ['checkable', 'opinion', 'bait', 'unverifiable'],
          },
          topic: {
            type: 'STRING',
            enum: ['banking_currency', 'government_scheme', 'elections', 'health', 'other'],
          },
          search_query: { type: 'STRING' },
        },
        required: ['text', 'kind', 'topic', 'search_query'],
      },
    },
    summary: { type: 'STRING' },
  },
  required: ['input_type', 'language', 'findings', 'claims', 'summary'],
} as const;

export const SPAR_SCHEMA = {
  type: 'OBJECT',
  properties: {
    reply: { type: 'STRING' },
    tactics_used: { type: 'ARRAY', items: { type: 'STRING', enum: TACTIC_ENUM } },
    user_turn_tags: {
      type: 'ARRAY',
      items: {
        type: 'STRING',
        enum: [
          'spotted_sign',
          'refused_info',
          'shared_info',
          'proposed_verification',
          'disengaged',
          'engaged',
        ],
      },
    },
    should_end: { type: 'BOOLEAN' },
  },
  required: ['reply', 'tactics_used', 'user_turn_tags', 'should_end'],
} as const;

export const DEBRIEF_SCHEMA = {
  type: 'OBJECT',
  properties: {
    tactics_seen: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          tactic: { type: 'STRING', enum: TACTIC_ENUM },
          quote: { type: 'STRING' },
        },
        required: ['tactic', 'quote'],
      },
    },
    did_well: { type: 'ARRAY', items: { type: 'STRING' } },
    improve: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          moment: { type: 'STRING' },
          safer_response: { type: 'STRING' },
        },
        required: ['moment', 'safer_response'],
      },
    },
  },
  required: ['tactics_seen', 'did_well', 'improve'],
} as const;

export const XRAY_SCHEMA = {
  type: 'OBJECT',
  properties: {
    visual_leaks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: {
            type: 'STRING',
            enum: [
              'school_logo',
              'uniform',
              'house_number',
              'vehicle_plate',
              'id_document',
              'boarding_pass',
              'screen_content',
              'street_sign',
              'landmark',
              'other',
            ],
          },
          description: { type: 'STRING' },
          box: { type: 'ARRAY', items: { type: 'NUMBER' } },
        },
        required: ['label', 'description', 'box'],
      },
    },
    caption_leaks: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          text: { type: 'STRING' },
          type: {
            type: 'STRING',
            enum: ['school', 'location', 'absence', 'birthday', 'contact', 'family', 'routine'],
          },
          explanation: { type: 'STRING' },
        },
        required: ['text', 'type', 'explanation'],
      },
    },
    stranger_learns: { type: 'ARRAY', items: { type: 'STRING' } },
    caption_rewrite: { type: 'STRING' },
  },
  required: ['visual_leaks', 'caption_leaks', 'stranger_learns', 'caption_rewrite'],
} as const;

export const OCR_SCHEMA = {
  type: 'OBJECT',
  properties: {
    text: { type: 'STRING' },
  },
  required: ['text'],
} as const;
