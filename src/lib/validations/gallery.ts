import { z } from "zod";

export const galleryCategorySchema = z.enum(["food", "ambiance"]);

export const objectPositionSchema = z
  .string()
  .min(1)
  .max(32)
  .refine(
    (v) =>
      /^(center|top|bottom|left|right)(\s+(center|top|bottom|left|right))?$/i.test(v) ||
      /^\d{1,3}%\s+\d{1,3}%$/.test(v),
    { message: "Invalid object position" },
  );

export const galleryImageFormSchema = z.object({
  title: z.string().max(120).optional().nullable(),
  alt_text: z.string().max(200).optional().nullable(),
  category: galleryCategorySchema,
  object_position: objectPositionSchema,
  is_visible: z.boolean(),
});

export type GalleryImageFormValues = z.infer<typeof galleryImageFormSchema>;

export const uploadFileSchema = z.object({
  file: z
    .instanceof(File)
    .refine((f) => f.size <= 8 * 1024 * 1024, "Image must be under 8MB")
    .refine(
      (f) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type),
      "Only JPEG, PNG, WebP, or GIF allowed",
    ),
  category: galleryCategorySchema,
});

export const POSITION_PRESETS = [
  { label: "Top", value: "top center" },
  { label: "Center", value: "center center" },
  { label: "Bottom", value: "bottom center" },
  { label: "Left", value: "left center" },
  { label: "Right", value: "right center" },
] as const;
