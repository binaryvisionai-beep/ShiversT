import type { RestaurantTable } from "./types";

export const VENUE_NAME = "Ozran, North Goa";

export const RESTAURANT_TABLES: RestaurantTable[] = [
  { id: "garden-1", name: "Garden 1", zone: "garden", seats: 2, premium: true },
  { id: "garden-2", name: "Garden 2", zone: "garden", seats: 4 },
  { id: "garden-3", name: "Garden 3", zone: "garden", seats: 6, premium: true },
  { id: "indoor-1", name: "Indoor 1", zone: "indoor", seats: 2 },
  { id: "indoor-2", name: "Indoor 2", zone: "indoor", seats: 4 },
  { id: "indoor-3", name: "Indoor 3", zone: "indoor", seats: 8 },
  { id: "terrace-1", name: "Terrace 1", zone: "terrace", seats: 2, premium: true },
  { id: "terrace-2", name: "Terrace 2", zone: "terrace", seats: 4, premium: true },
  { id: "terrace-3", name: "Terrace 3", zone: "terrace", seats: 6 },
];

export const ZONE_LABELS: Record<string, string> = {
  all: "All",
  garden: "Garden",
  indoor: "Indoor",
  terrace: "Terrace",
};
