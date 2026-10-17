/**
 * QR decoding, locally with jsQR. A upi://pay QR SENDS money from the scanner —
 * "scan this to receive money" is one of the most common UPI scams.
 */

import { loadImage } from './image';

export type QrPayloadKind = 'upi_pay' | 'url' | 'text';

export interface UpiPayload {
  payeeAddress?: string;
  payeeName?: string;
  amount?: string;
  note?: string;
}

export interface QrResult {
  kind: QrPayloadKind;
  raw: string;
  upi?: UpiPayload;
  url?: string;
}

export async function decodeQr(file: Blob): Promise<QrResult | null> {
  const img = await loadImage(file);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  // Loaded on demand, so the landing page never pays for the QR decoder.
  const jsQR = (await import('jsqr')).default;
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (!code?.data) return null;

  return classifyQr(code.data);
}

export function classifyQr(raw: string): QrResult {
  const trimmed = raw.trim();

  if (/^upi:\/\//i.test(trimmed)) {
    const query = trimmed.split('?')[1] ?? '';
    const params = new URLSearchParams(query);
    return {
      kind: 'upi_pay',
      raw: trimmed,
      upi: {
        payeeAddress: params.get('pa') ?? undefined,
        payeeName: params.get('pn') ?? undefined,
        amount: params.get('am') ?? undefined,
        note: params.get('tn') ?? undefined,
      },
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return { kind: 'url', raw: trimmed, url: trimmed };
  }

  return { kind: 'text', raw: trimmed };
}

export const UPI_PAY_WARNING = {
  en: 'This QR code SENDS money from you. Scanning a QR to "receive money" is a common scam.',
  hi: 'यह क्यूआर कोड आपके पैसे भेजता है। "पैसे लेने" के लिए क्यूआर स्कैन कराना आम ठगी है।',
};
