export const REVIEW_SECTIONS = [
  { id: "restaurant", label: "Restaurant" },
  { id: "rooms", label: "Rooms Oasis" },
  { id: "tiffin", label: "Northeast Tiffin Box" },
] as const;

export type ReviewSection = (typeof REVIEW_SECTIONS)[number]["id"];

export const REVIEW_SETTINGS_IDS: Record<ReviewSection, string> = {
  restaurant: "00000000-0000-0000-0000-000000000001",
  rooms: "00000000-0000-0000-0000-000000000002",
  tiffin: "00000000-0000-0000-0000-000000000003",
};

export const DEFAULT_GOOGLE_MAP_URLS: Record<ReviewSection, string | null> = {
  restaurant: null,
  rooms: "https://maps.app.goo.gl/ZwpBDJ43S9n1ekvY6",
  tiffin: "https://maps.app.goo.gl/sZ5Fs815izKUhbkN9",
};

export function isReviewSection(value: string): value is ReviewSection {
  return REVIEW_SECTIONS.some((s) => s.id === value);
}
