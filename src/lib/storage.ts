/**
 * Local storage, wrapped so a blocked or full store never breaks a screen.
 * Only scores, quiz results and the language choice are stored. Never content.
 */

import { emptyProfile, type PressureProfile } from '../core/levers';

const PREFIX = 'sys.';

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* ignore: private mode, quota, disabled storage */
  }
}

/* ------------------------------------------------------------------ language */

export function getLanguage(): 'en' | 'hi' {
  return read<'en' | 'hi'>('lang') ?? 'en';
}

export function setLanguage(lang: 'en' | 'hi'): void {
  write('lang', lang);
}

/* -------------------------------------------------------------- spar scores */

export interface SparScoreRecord {
  personaId: string;
  score: number;
  date: string;
}

export function saveSparScore(record: SparScoreRecord): void {
  const all = read<SparScoreRecord[]>('sparScores') ?? [];
  all.push(record);
  write('sparScores', all.slice(-50));
}

export function bestSparScore(personaId?: string): number | null {
  const all = read<SparScoreRecord[]>('sparScores') ?? [];
  const relevant = personaId ? all.filter((r) => r.personaId === personaId) : all;
  if (!relevant.length) return null;
  return Math.max(...relevant.map((r) => r.score));
}

/* -------------------------------------------------------- pressure profile */

export function getProfile(): PressureProfile {
  const stored = read<PressureProfile>('pressureProfile');
  if (!stored) return emptyProfile();

  // Merge onto a fresh profile so a stored shape from an older build is safe.
  const base = emptyProfile();
  for (const lever of Object.keys(base) as Array<keyof PressureProfile>) {
    const record = stored[lever];
    if (record && typeof record.faced === 'number' && typeof record.folded === 'number') {
      base[lever] = { faced: record.faced, folded: record.folded };
    }
  }
  return base;
}

export function saveProfile(profile: PressureProfile): void {
  write('pressureProfile', profile);
}

export function resetProfile(): void {
  write('pressureProfile', emptyProfile());
}

/* ------------------------------------------------------------ quiz results */

export interface QuizResult {
  set: 'a' | 'b';
  correct: number;
  total: number;
  answers: Array<{ itemId: string; answer: string; correct: boolean }>;
  date: string;
}

export function saveQuizResult(result: QuizResult): void {
  const all = read<QuizResult[]>('quizResults') ?? [];
  all.push(result);
  write('quizResults', all.slice(-50));
}

export function allQuizResults(): QuizResult[] {
  return read<QuizResult[]>('quizResults') ?? [];
}

export function quizResultsCsv(): string {
  const rows = allQuizResults();
  const header = 'date,set,correct,total,item_id,answer,was_correct';
  const lines = rows.flatMap((r) =>
    r.answers.map((a) =>
      [r.date, r.set, r.correct, r.total, a.itemId, a.answer, a.correct].join(','),
    ),
  );
  return [header, ...lines].join('\n');
}

/* -------------------------------------------------------- one-time notices */

export function noticeSeen(key: string): boolean {
  return read<boolean>(`notice.${key}`) === true;
}

export function markNoticeSeen(key: string): void {
  write(`notice.${key}`, true);
}
