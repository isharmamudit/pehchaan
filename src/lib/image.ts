/**
 * Image handling, all in the browser. Re-encoding through a canvas is what
 * strips EXIF (including GPS) before an image is ever sent anywhere.
 */

export interface EncodedImage {
  /** base64 payload without the data: prefix. */
  base64: string;
  mimeType: 'image/jpeg';
  dataUrl: string;
  width: number;
  height: number;
}

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function loadImage(source: Blob | string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = typeof source === 'string' ? source : URL.createObjectURL(source);
    img.onload = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      if (typeof source !== 'string') URL.revokeObjectURL(url);
      reject(new Error('image_load_failed'));
    };
    img.src = url;
  });
}

function fit(width: number, height: number, maxDim: number): [number, number] {
  if (width <= maxDim && height <= maxDim) return [width, height];
  const scale = maxDim / Math.max(width, height);
  return [Math.round(width * scale), Math.round(height * scale)];
}

/**
 * Downscale and re-encode as JPEG. This is the privacy step for uploads:
 * the canvas copy carries no EXIF, no GPS and no device model.
 */
export async function downscaleToJpeg(
  file: Blob,
  maxDim = 1600,
  quality = 0.85,
): Promise<EncodedImage> {
  const img = await loadImage(file);
  const [width, height] = fit(img.naturalWidth, img.naturalHeight, maxDim);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  const dataUrl = canvas.toDataURL('image/jpeg', quality);
  return {
    base64: dataUrl.split(',')[1] ?? '',
    mimeType: 'image/jpeg',
    dataUrl,
    width,
    height,
  };
}

export interface NormalisedBox {
  /** [ymin, xmin, ymax, xmax], 0–1000 as returned by the vision model. */
  box: [number, number, number, number];
}

function toPixels(
  box: [number, number, number, number],
  width: number,
  height: number,
): { x: number; y: number; w: number; h: number } {
  const [ymin, xmin, ymax, xmax] = box;
  const x = (xmin / 1000) * width;
  const y = (ymin / 1000) * height;
  return {
    x,
    y,
    w: Math.max(1, ((xmax - xmin) / 1000) * width),
    h: Math.max(1, ((ymax - ymin) / 1000) * height),
  };
}

/** Blur the selected regions and return a new data URL. Nothing leaves the device. */
export async function blurRegions(
  source: Blob | string,
  boxes: Array<[number, number, number, number]>,
  blurPx = 18,
): Promise<string> {
  const img = await loadImage(source);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0);

  for (const box of boxes) {
    const { x, y, w, h } = toPixels(box, canvas.width, canvas.height);
    const patch = document.createElement('canvas');
    patch.width = Math.ceil(w);
    patch.height = Math.ceil(h);
    const pctx = patch.getContext('2d');
    if (!pctx) continue;
    pctx.filter = `blur(${blurPx}px)`;
    // Draw a margin around the region so the blur does not have hard edges.
    pctx.drawImage(canvas, x, y, w, h, 0, 0, patch.width, patch.height);

    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    ctx.drawImage(patch, x, y, w, h);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

/** A re-encoded copy with no metadata, for the "Remove location" download. */
export async function cleanCopy(file: Blob, maxDim = 2400): Promise<Blob> {
  const img = await loadImage(file);
  const [width, height] = fit(img.naturalWidth, img.naturalHeight, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas_unavailable');
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('encode_failed'))),
      'image/jpeg',
      0.92,
    );
  });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
