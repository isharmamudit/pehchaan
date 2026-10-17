import type { Lang, TacticId } from './tactics';

/**
 * Where a finding came from. Set by code, NEVER by the AI.
 *  rule    – deterministic regex / local check in the browser
 *  service – an external service (Safe Browsing, redirect expansion)
 *  source  – a cited fact-check publisher
 *  ai      – Gemini explanation, text verified against the input
 */
export type Evidence = 'rule' | 'service' | 'source' | 'ai';

export type Verdict = 'likely_scam' | 'suspicious' | 'no_red_flags';

export type InputType =
  | 'message'
  | 'url'
  | 'claim_forward'
  | 'screenshot'
  | 'qr'
  | 'voice_transcript';

export interface Span {
  start: number;
  end: number;
}

export interface Finding extends Span {
  id: string;
  tactic: TacticId;
  /** Exact substring of the original input. */
  matchedText: string;
  evidence: Evidence;
  /** One plain sentence, in the user's language. */
  explanation: string;
  /** 1–3, only meaningful for rule findings; AI findings score 1. */
  weight: number;
  ruleId?: string;
  /** Optional AI wording attached to a rule finding after de-duplication. */
  aiExplanation?: string;
  /** True when the finding came from a known-hoax template. */
  hoaxTemplate?: boolean;
}

/**
 * How a statement should be treated:
 *  checkable    – a factual claim a publisher could verify
 *  opinion      – a value judgement, not checkable
 *  bait         – engagement bait: "forward to 10 groups", "share before deleted"
 *  unverifiable – factual in form but impossible to check (anonymous source, private event)
 */
export type ClaimKind = 'checkable' | 'opinion' | 'bait' | 'unverifiable';

export type ClaimTopic =
  | 'banking_currency'
  | 'government_scheme'
  | 'elections'
  | 'health'
  | 'other';

export type ClaimLabel =
  | 'fact_checked_false'
  | 'fact_checked_accurate'
  | 'disputed'
  | 'not_verified'
  | 'opinion'
  | 'bait'
  | 'unverifiable';

export interface FactCheckMatch {
  publisher: string;
  title: string;
  url: string;
  textualRating: string;
  reviewDate?: string;
}

export interface GroundedSource {
  title: string;
  url: string;
}

export interface Claim {
  id: string;
  text: string;
  kind: ClaimKind;
  topic: ClaimTopic;
  searchQuery: string;
  label: ClaimLabel;
  matches: FactCheckMatch[];
  /** Grounded links for claims no fact-checker has covered. Links only, never a verdict. */
  sources?: GroundedSource[];
  evidence: Evidence;
}

export interface LookalikeResult {
  flag: boolean;
  matchedBrand?: string;
  reason?: string;
}

export type SafeBrowsingStatus = 'match' | 'no_match' | 'unavailable';

export interface UrlResult {
  original: string;
  final: string;
  hops: number;
  isShortener: boolean;
  lookalike: LookalikeResult;
  safeBrowsing: SafeBrowsingStatus;
  threatTypes?: string[];
  error?: string;
}

/** Names of services that failed, so the UI can list them honestly. */
export type ServiceName = 'ai' | 'link_checker' | 'fact_check';

export interface RedactionCounts {
  [category: string]: number;
}

export interface AnalysisResult {
  verdict: Verdict;
  score: number;
  inputType: InputType;
  language: Lang;
  /** Original, unredacted text — stays in the browser. */
  text: string;
  findings: Finding[];
  claims: Claim[];
  urls: UrlResult[];
  summary?: string;
  redactionCounts: RedactionCounts;
  unavailable: ServiceName[];
  /** Set when the result came from the recorded demo cache. */
  cached?: boolean;
}
