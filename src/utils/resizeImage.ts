export async function resizeImageTo100(input: File | Blob | string): Promise<Blob> {
  const src = await toDataUrl(input);
  const img = await loadImage(src);
  const targetSize = 100;

  const sw = img.naturalWidth;
  const sh = img.naturalHeight;

  // scale to cover target (center-crop)
  const scale = Math.max(targetSize / sw, targetSize / sh);
  const srcW = targetSize / scale;
  const srcH = targetSize / scale;
  const sx = Math.max(0, (sw - srcW) / 2);
  const sy = Math.max(0, (sh - srcH) / 2);

  const canvas = document.createElement('canvas');
  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  ctx.drawImage(img, sx, sy, srcW, srcH, 0, 0, targetSize, targetSize);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to create blob from canvas'));
    }, 'image/png', 0.92);
  });
}

export function blobToFile(blob: Blob, fileName = 'resized.png'): File {
  return new File([blob], fileName, { type: blob.type });
}

async function toDataUrl(input: File | Blob | string): Promise<string> {
  if (typeof input === 'string') return input;
  const blob = input instanceof Blob ? input : input as Blob;
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = src;
    // For local files in some browsers, set crossOrigin if needed
  });
}

/* Usage example (in a React component):

import { resizeImageTo100, blobToFile } from './utils/resizeImage';

async function handleFile(file: File) {
  const blob = await resizeImageTo100(file);
  const resizedFile = blobToFile(blob, `thumb_${file.name}`);
  // upload `resizedFile` or create object URL:
  const url = URL.createObjectURL(blob);
  // set state to show preview
}

*/
