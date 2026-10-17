/**
 * Post X-Ray client. The photo is downscaled and re-encoded locally (which
 * strips metadata) and the caption is redacted before either is sent.
 */

import { callFunction } from './api';
import { downscaleToJpeg } from './image';
import { redact } from '../core/redact';
import { captionFindings, metadataFindings, type PhotoMetadata, type XrayFinding } from '../core/postXray';
import { readMetadata } from './exif';
import type { Lang } from '../core/tactics';
import type { XrayResponse } from '../core/contracts';

export interface LocalXray {
  metadata: PhotoMetadata;
  findings: XrayFinding[];
}

/** Step one: everything that can be done without sending anything anywhere. */
export async function localXray(file: Blob, caption: string, lang: Lang): Promise<LocalXray> {
  const metadata = await readMetadata(file);
  return {
    metadata,
    findings: [...metadataFindings(metadata, lang), ...captionFindings(caption, lang)],
  };
}

export interface RemoteXray {
  findings: XrayFinding[];
  strangerLearns: string[];
  captionRewrite: string;
  unavailable: boolean;
}

/** Step two, only after the user consents: the vision pass. */
export async function remoteXray(
  file: Blob,
  caption: string,
  lang: Lang,
): Promise<RemoteXray> {
  const image = await downscaleToJpeg(file, 1280, 0.82);
  const { redacted } = redact(caption);

  const res = await callFunction<XrayResponse>(
    'xray',
    {
      imageBase64: image.base64,
      mimeType: image.mimeType,
      caption: redacted,
      language: lang,
    },
    { timeoutMs: 20000 },
  );

  if (!res.ok || res.data.ai_unavailable) {
    return { findings: [], strangerLearns: [], captionRewrite: '', unavailable: true };
  }

  const findings: XrayFinding[] = [
    ...res.data.visual_leaks.map((v, i) => ({
      id: `visual_${i}`,
      kind: 'visual' as const,
      evidence: 'ai' as const,
      title: v.label.replace(/_/g, ' '),
      detail: v.description,
      visualLabel: v.label,
      box: v.box,
    })),
    ...res.data.caption_leaks.map((c, i) => ({
      id: `caption_ai_${i}`,
      kind: 'caption' as const,
      evidence: 'ai' as const,
      title: c.type,
      detail: c.explanation,
      text: c.text,
      leakType: c.type,
    })),
  ];

  return {
    findings,
    strangerLearns: res.data.stranger_learns,
    captionRewrite: res.data.caption_rewrite,
    unavailable: false,
  };
}
