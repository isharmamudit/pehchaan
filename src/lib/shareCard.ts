/**
 * Share card. The PNG carries the verdict, the red-flag count and the top
 * tactic names only. Never the message, never a link, never personal details.
 */

import type { TacticId } from '../core/tactics';
import type { Verdict } from '../core/types';

export interface ShareCardData {
  verdict: Verdict;
  redFlagCount: number;
  topTactics: TacticId[];
}

export async function renderCard(node: HTMLElement): Promise<Blob> {
  const { toPng } = await import('html-to-image');
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const res = await fetch(dataUrl);
  return res.blob();
}

export async function shareCard(blob: Blob, filename = 'pehchaan.png'): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/png' });

  const nav = navigator as Navigator & {
    canShare?: (data: { files?: File[] }) => boolean;
    share?: (data: { files?: File[]; title?: string }) => Promise<void>;
  };

  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: 'Pehchaan' });
      return 'shared';
    } catch {
      /* user cancelled or sharing failed — fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
