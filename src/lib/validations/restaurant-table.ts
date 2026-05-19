import { z } from "zod";

export const restaurantTableFormSchema = z.object({
  name: z.string().min(1, "Table name is required").max(80),
  zone: z.enum(["garden", "indoor", "terrace"]),
  seats: z.coerce.number().int().min(1, "At least 1 seat").max(20),
  premium: z.boolean(),
  details: z.string().max(300).optional(),
});

export type RestaurantTableFormValues = z.infer<typeof restaurantTableFormSchema>;

export function formValuesToRestaurantTable(
  values: RestaurantTableFormValues,
  existingIds: string[],
): {
  id: string;
  name: string;
  zone: RestaurantTableFormValues["zone"];
  seats: number;
  premium?: boolean;
  details?: string;
} {
  const base = values.name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let id = `${values.zone}-${base || "table"}`;
  let n = 1;
  while (existingIds.includes(id)) {
    id = `${values.zone}-${base || "table"}-${n}`;
    n += 1;
  }
  return {
    id,
    name: values.name.trim(),
    zone: values.zone,
    seats: values.seats,
    premium: values.premium || undefined,
    details: values.details?.trim() || undefined,
  };
}
