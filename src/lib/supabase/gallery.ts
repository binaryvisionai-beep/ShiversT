import { supabase } from "@/lib/supabase";
import {
  compressImage,
  extractStoragePathFromUrl,
  generateBlurDataUrl,
  getGalleryStoragePath,
  getPublicUrl,
} from "@/lib/image-utils";
import type {
  GalleryCategory,
  GalleryFilter,
  GalleryImage,
  GalleryImageInsert,
  GalleryImageUpdate,
  GallerySort,
  GalleryStats,
} from "@/types/gallery";

const BUCKET = "gallery-images";
const TABLE = "gallery_images";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;

export type FetchGalleryOptions = {
  category?: GalleryFilter;
  search?: string;
  sort?: GallerySort;
  includeHidden?: boolean;
};

export async function fetchGalleryImages(
  options: FetchGalleryOptions = {},
): Promise<GalleryImage[]> {
  let query = supabase.from(TABLE).select("*");

  if (options.category && options.category !== "all") {
    query = query.eq("category", options.category);
  }

  if (options.search?.trim()) {
    const s = options.search.trim().replace(/,/g, "");
    query = query.or(`title.ilike.%${s}%,alt_text.ilike.%${s}%`);
  }

  const sortCol = options.sort === "created_at" ? "created_at" : "display_order";
  query = query.order(sortCol, { ascending: sortCol === "display_order" });
  if (sortCol === "display_order") {
    query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as GalleryImage[];
}

export function computeGalleryStats(images: GalleryImage[]): GalleryStats {
  return {
    total: images.length,
    food: images.filter((i) => i.category === "food").length,
    ambiance: images.filter((i) => i.category === "ambiance").length,
    hidden: images.filter((i) => !i.is_visible).length,
  };
}

export async function getNextDisplayOrder(): Promise<number> {
  const { data, error } = await supabase
    .from(TABLE)
    .select("display_order")
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.display_order ?? -1) + 1;
}

export async function createGalleryImage(payload: GalleryImageInsert): Promise<GalleryImage> {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();

  if (error) throw new Error(error.message);
  return data as GalleryImage;
}

export async function updateGalleryImage(
  id: string,
  patch: GalleryImageUpdate,
): Promise<GalleryImage> {
  const { data, error } = await supabase.from(TABLE).update(patch).eq("id", id).select().single();

  if (error) throw new Error(error.message);
  return data as GalleryImage;
}

export async function deleteGalleryImageRecord(id: string): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteGalleryStorage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) throw new Error(error.message);
}

export async function deleteGalleryImage(image: GalleryImage): Promise<void> {
  const path = extractStoragePathFromUrl(image.image_url);
  await deleteGalleryImageRecord(image.id);
  if (path) {
    try {
      await deleteGalleryStorage(path);
    } catch {
      /* storage may already be removed */
    }
  }
}

export async function reorderGalleryImages(orderedIds: string[]): Promise<void> {
  const updates = orderedIds.map((id, index) =>
    supabase.from(TABLE).update({ display_order: index }).eq("id", id),
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function bulkUpdateGalleryImages(
  ids: string[],
  patch: GalleryImageUpdate,
): Promise<void> {
  const { error } = await supabase.from(TABLE).update(patch).in("id", ids);
  if (error) throw new Error(error.message);
}

export async function bulkDeleteGalleryImages(images: GalleryImage[]): Promise<void> {
  for (const image of images) {
    await deleteGalleryImage(image);
  }
}

export type UploadGalleryInput = {
  file: File;
  category: GalleryCategory;
  title?: string;
  alt_text?: string;
  uploadedBy?: string;
};

export async function uploadGalleryImage(input: UploadGalleryInput): Promise<GalleryImage> {
  const id = crypto.randomUUID();
  const compressed = await compressImage(input.file);
  const blur = await generateBlurDataUrl(compressed);
  const path = getGalleryStoragePath(input.category, id, "webp");

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: "image/webp",
    upsert: false,
  });

  if (uploadError) throw new Error(uploadError.message);

  const imageUrl = getPublicUrl(supabaseUrl, path);
  const displayOrder = await getNextDisplayOrder();

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      id,
      title: input.title?.trim() || null,
      image_url: imageUrl,
      category: input.category,
      display_order: displayOrder,
      is_visible: true,
      object_position: "center center",
      alt_text: input.alt_text?.trim() || null,
      blur_data_url: blur,
      uploaded_by: input.uploadedBy ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as GalleryImage;
}

export async function duplicateGalleryImage(
  source: GalleryImage,
  uploadedBy?: string,
): Promise<GalleryImage> {
  const path = extractStoragePathFromUrl(source.image_url);
  if (!path) throw new Error("Cannot duplicate: invalid storage URL");

  const { data: blob, error: downloadError } = await supabase.storage.from(BUCKET).download(path);

  if (downloadError || !blob) throw new Error(downloadError?.message ?? "Download failed");

  const newId = crypto.randomUUID();
  const newPath = getGalleryStoragePath(source.category, newId, "webp");
  const file = new File([blob], `${newId}.webp`, { type: "image/webp" });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(newPath, file, { contentType: "image/webp", upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const displayOrder = await getNextDisplayOrder();
  const imageUrl = getPublicUrl(supabaseUrl, newPath);

  return createGalleryImage({
    title: source.title ? `${source.title} (copy)` : null,
    image_url: imageUrl,
    category: source.category,
    display_order: displayOrder,
    is_visible: source.is_visible,
    object_position: source.object_position,
    alt_text: source.alt_text,
    blur_data_url: source.blur_data_url,
    uploaded_by: uploadedBy ?? null,
  });
}
