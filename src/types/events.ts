export type EventImage = {
  id: string;
  event_id: string;
  image_url: string;
  sort_order: number;
  created_at?: string;
};

export type SpecialEvent = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  button_text: string;
  redirect_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  images: EventImage[];
};

export type SpecialEventInsert = {
  title: string;
  subtitle: string;
  description: string;
  button_text?: string;
  redirect_url?: string | null;
  is_active?: boolean;
  sort_order?: number;
};

export type SpecialEventUpdate = Partial<SpecialEventInsert>;

export type FetchEventsOptions = {
  search?: string;
  includeInactive?: boolean;
};
