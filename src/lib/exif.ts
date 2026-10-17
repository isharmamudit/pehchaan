/** Photo metadata, read locally with exifr. The file is never uploaded for this. */

import type { PhotoMetadata } from '../core/postXray';

export async function readMetadata(file: Blob): Promise<PhotoMetadata> {
  try {
    // Loaded on demand: exifr is large and only Protect needs it.
    const exifr = (await import('exifr')).default;
    const data = (await exifr.parse(file, {
      pick: ['latitude', 'longitude', 'GPSLatitude', 'GPSLongitude', 'Make', 'Model', 'DateTimeOriginal'],
      gps: true,
    })) as Record<string, unknown> | undefined;

    if (!data) return {};

    const dto = data.DateTimeOriginal;
    return {
      latitude: typeof data.latitude === 'number' ? data.latitude : undefined,
      longitude: typeof data.longitude === 'number' ? data.longitude : undefined,
      make: typeof data.Make === 'string' ? data.Make.trim() : undefined,
      model: typeof data.Model === 'string' ? data.Model.trim() : undefined,
      dateTimeOriginal:
        dto instanceof Date
          ? dto.toLocaleString()
          : typeof dto === 'string'
            ? dto
            : undefined,
    };
  } catch {
    return {};
  }
}

export function mapLink(lat: number, lon: number): string {
  const la = lat.toFixed(3);
  const lo = lon.toFixed(3);
  return `https://www.openstreetmap.org/?mlat=${la}&mlon=${lo}#map=14/${la}/${lo}`;
}
