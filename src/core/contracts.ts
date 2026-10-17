/**
 * Wire contracts between the browser and the edge functions.
 * Keep in sync with supabase/functions/_shared/schema.ts.
 */

import type { Lang, TacticId } from './tactics';
import type {
  ClaimKind,
  ClaimTopic,
  FactCheckMatch,
  InputType,
  UrlResult,
} from './types';

/* ------------------------------------------------------------------ analyze */

export interface AnalyzeRequest {
  /** Redacted text. Personal details are already replaced with tokens. */
  text: string;
  language: Lang;
  inputType: InputType;
  /** Rule hits, matched text redacted, so the AI knows what code already found. */
  ruleFindings: Array<{ tactic: TacticId; text: string }>;
  urls?: UrlResult[];
}

export interface AiFinding {
  text: string;
  tactic: TacticId;
  explanation: string;
}

export interface AiClaim {
  text: string;
  kind: ClaimKind;
  topic: ClaimTopic;
  search_query: string;
}

export interface AnalyzeResponse {
  input_type?: InputType;
  language?: string;
  findings?: AiFinding[];
  claims?: AiClaim[];
  summary?: string;
  ai_unavailable?: boolean;
}

/* --------------------------------------------------------------- check-urls */

export interface CheckUrlsRequest {
  urls: string[];
}

export interface CheckUrlsResponse {
  results: UrlResult[];
  /** True when Safe Browsing could not be reached; lookalike checks still ran. */
  safeBrowsingUnavailable?: boolean;
}

/* --------------------------------------------------------------- fact-check */

export interface FactCheckRequest {
  claims: Array<{ id: string; query: string; languageCodes?: string[] }>;
  /** P1: ask for grounded reputable links when no fact-check exists. */
  ground?: boolean;
}

export interface GroundedSource {
  title: string;
  url: string;
}

export interface FactCheckResponse {
  results: Array<{ id: string; matches: FactCheckMatch[]; sources?: GroundedSource[] }>;
  unavailable?: boolean;
}

/* --------------------------------------------------------------------- spar */

export type UserTurnTag =
  | 'spotted_sign'
  | 'refused_info'
  | 'shared_info'
  | 'proposed_verification'
  | 'disengaged'
  | 'engaged';

export interface SparMessage {
  role: 'scammer' | 'user';
  text: string;
}

export interface SparRequest {
  personaId: string;
  language: Lang;
  history: SparMessage[];
  /** Only for the personalised persona built from Post X-Ray. */
  knownFacts?: string[];
  /** Adaptive sparring: lean on the lever this person folds under. */
  targetLever?: 'fear' | 'authority' | 'greed' | 'urgency' | 'trust';
}

export interface SparResponse {
  reply: string;
  tactics_used: TacticId[];
  user_turn_tags: UserTurnTag[];
  should_end: boolean;
  /** Set by the client when the scripted fallback produced this turn. */
  fallback?: boolean;
}

/* ------------------------------------------------------------------ debrief */

export interface DebriefRequest {
  personaId: string;
  language: Lang;
  history: SparMessage[];
  knownFacts?: string[];
}

export interface DebriefResponse {
  tactics_seen: Array<{ tactic: TacticId; quote: string }>;
  did_well: string[];
  improve: Array<{ moment: string; safer_response: string }>;
  fallback?: boolean;
}

/* --------------------------------------------------------------------- xray */

export type VisualLeakLabel =
  | 'school_logo'
  | 'uniform'
  | 'house_number'
  | 'vehicle_plate'
  | 'id_document'
  | 'boarding_pass'
  | 'screen_content'
  | 'street_sign'
  | 'landmark'
  | 'other';

export type CaptionLeakType =
  | 'school'
  | 'location'
  | 'absence'
  | 'birthday'
  | 'contact'
  | 'family'
  | 'routine';

export interface XrayRequest {
  /** base64 JPEG, already downscaled and re-encoded in the browser. */
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
  /** Redacted caption. */
  caption?: string;
  language: Lang;
}

export interface XrayResponse {
  visual_leaks: Array<{
    label: VisualLeakLabel;
    description: string;
    /** Normalised 0–1000, [ymin, xmin, ymax, xmax]. */
    box: [number, number, number, number];
  }>;
  caption_leaks: Array<{ text: string; type: CaptionLeakType; explanation: string }>;
  stranger_learns: string[];
  caption_rewrite: string;
  ai_unavailable?: boolean;
}

/* ---------------------------------------------------------------- ocr/vision */

export interface OcrRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

export interface OcrResponse {
  text: string;
  ai_unavailable?: boolean;
}
