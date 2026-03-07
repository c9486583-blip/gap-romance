const MAX_DIMENSION = 1200;
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB target after compression
const QUALITY_STEPS = [0.85, 0.7, 0.55, 0.4];

/**
 * Compress and resize an image file client-side before upload.
 * Returns a JPEG blob ≤ 2MB at max 1200x1200.
 */
export async function compressImage(file: File): Promise<File> {
  // HEIC/HEIF can't be drawn to canvas in most browsers — return as-is
  if (file.type === "image/heic" || file.type === "image/heif") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;

  // Scale down to fit within MAX_DIMENSION
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const scale = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file; // fallback
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  // If file is already small enough, just resize
  if (file.size <= MAX_FILE_SIZE && file.type === "image/jpeg") {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 });
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  }

  // Try progressively lower quality until under 2MB
  for (const quality of QUALITY_STEPS) {
    const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
    if (blob.size <= MAX_FILE_SIZE) {
      return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
    }
  }

  // Last resort: lowest quality
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality: 0.3 });
  return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
}
