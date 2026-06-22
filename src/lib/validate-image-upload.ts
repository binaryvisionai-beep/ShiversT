export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export function getImageUploadError(file: File): string | null {
  if (!file.type.startsWith("image/")) {
    return "Please upload an image file.";
  }
  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return "Image must be 5 MB or smaller.";
  }
  return null;
}

export function assertImageUploadAllowed(file: File): void {
  const error = getImageUploadError(file);
  if (error) throw new Error(error);
}
