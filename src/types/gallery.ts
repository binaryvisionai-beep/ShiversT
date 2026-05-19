export type GalleryCategory = "food" | "ambiance";

export type GalleryFilter = "all" | GalleryCategory;

export type GallerySort = "display_order" | "created_at";

export type GalleryImage = {
  id: string;
  title: string | null;
  image_url: string;
  category: GalleryCategory;
  display_order: number;
  is_visible: boolean;
  object_position: string;
  alt_text: string | null;
  blur_data_url: string | null;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type GalleryImageInsert = {
  title?: string | null;
  image_url: string;
  category: GalleryCategory;
  display_order?: number;
  is_visible?: boolean;
  object_position?: string;
  alt_text?: string | null;
  blur_data_url?: string | null;
  uploaded_by?: string | null;
};

export type GalleryImageUpdate = Partial<Omit<GalleryImage, "id" | "created_at" | "updated_at">>;

export type GalleryStats = {
  total: number;
  food: number;
  ambiance: number;
  hidden: number;
};
