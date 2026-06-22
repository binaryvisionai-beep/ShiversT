import imageCompression from "browser-image-compression";

const BUCKET = "gallery-images";

export function getGalleryStoragePath(category: string, id: string, ext = "webp") {
  return `${category}/${id}.${ext}`;
}

export function getPublicUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}

export function extractStoragePathFromUrl(imageUrl: string): string | null {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return null;
  return imageUrl.slice(idx + marker.length);
}

export async function compressImage(file: File): Promise<File> {
  const compressed = await imageCompression(file, {
    maxSizeMB: 1.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
    fileType: "image/webp",
    initialQuality: 0.85,
  });
  return compressed;
}

export async function generateBlurDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = 24;
      const h = Math.round((img.height / img.width) * w) || 24;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas unavailable"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.6));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for blur"));
    };
    img.src = url;
  });
}

export function fileExtension(file: File): string {
  if (file.type === "image/webp") return "webp";
  if (file.type === "image/png") return "png";
  if (file.type === "image/gif") return "gif";
  return "jpg";
}

export type ImageMeta = {
  fileName: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: string;
  megapixels: string;
  fileSize: string | null;
  format: string | null;
};

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  const decimal = (width / height).toFixed(2);
  if (w <= 20 && h <= 20) return `${w}:${h} (${decimal}:1)`;
  return `${decimal}:1`;
}

function getOrientation(width: number, height: number): string {
  if (width === height) return "Square";
  return width > height ? "Landscape" : "Portrait";
}

function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url.split("/").pop() || url;
  }
}

function getFormatFromUrl(url: string): string | null {
  const name = getFileNameFromUrl(url).toLowerCase();
  const match = name.match(/\.(jpe?g|png|gif|webp|svg|avif|bmp)$/);
  return match ? match[1].toUpperCase() : null;
}

export async function loadImageMeta(url: string): Promise<ImageMeta> {
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });

  let fileSize: string | null = null;
  try {
    const res = await fetch(url, { method: "HEAD" });
    const len = res.headers.get("content-length");
    if (len) fileSize = formatFileSize(Number(len));
  } catch {
  }

  if (!fileSize) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      fileSize = formatFileSize(blob.size);
    } catch {
    }
  }

  return {
    fileName: getFileNameFromUrl(url),
    width,
    height,
    aspectRatio: formatAspectRatio(width, height),
    orientation: getOrientation(width, height),
    megapixels: ((width * height) / 1_000_000).toFixed(2),
    fileSize,
    format: getFormatFromUrl(url),
  };
}

export async function loadImageMetaFromFile(file: File): Promise<ImageMeta> {
  const url = URL.createObjectURL(file);
  try {
    const meta = await loadImageMeta(url);
    return {
      ...meta,
      fileName: file.name,
      fileSize: formatFileSize(file.size),
      format: file.type.split("/")[1]?.toUpperCase() ?? getFormatFromUrl(file.name),
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}
