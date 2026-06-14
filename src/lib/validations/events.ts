import { z } from "zod";

export const eventFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(120),
  subtitle: z.string().trim().max(200),
  description: z.string().trim().max(5000),
  button_text: z.string().trim().min(1, "Button text is required").max(60),
  redirect_url: z
    .string()
    .trim()
    .max(500)
    .refine(
      (v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v),
      "Use a path like /contact or a full URL",
    ),
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});

export type EventFormValues = z.infer<typeof eventFormSchema>;
