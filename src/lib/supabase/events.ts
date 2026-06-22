import { supabase } from "@/lib/supabase";
import { assertImageUploadAllowed } from "@/lib/validate-image-upload";
import type {
  EventImage,
  FetchEventsOptions,
  SpecialEvent,
  SpecialEventInsert,
  SpecialEventUpdate,
} from "@/types/events";

const EVENTS_TABLE = "events_special_events";
const IMAGES_TABLE = "events_special_event_images";
const BUCKET = "events";

export async function fetchEvents(options: FetchEventsOptions = {}): Promise<SpecialEvent[]> {
  let query = supabase.from(EVENTS_TABLE).select("*").order("sort_order", { ascending: true });

  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }

  if (options.search?.trim()) {
    const s = options.search.trim().replace(/,/g, "");
    query = query.ilike("title", `%${s}%`);
  }

  const { data: evData, error } = await query;
  if (error) throw new Error(error.message);

  const withImages = await Promise.all(
    (evData ?? []).map(async (ev) => {
      const { data: imgs, error: imgError } = await supabase
        .from(IMAGES_TABLE)
        .select("*")
        .eq("event_id", ev.id)
        .order("sort_order", { ascending: true });

      if (imgError) {
        console.warn("Failed to load images for event", ev.id, imgError.message);
      }

      return {
        ...ev,
        button_text: ev.button_text ?? "View Details",
        redirect_url: ev.redirect_url ?? null,
        images: (imgs ?? []) as EventImage[],
      } as SpecialEvent;
    }),
  );

  return withImages;
}

export async function getNextSortOrder(): Promise<number> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data?.sort_order ?? 0) + 1;
}

export async function createEvent(
  payload: SpecialEventInsert,
  imageUrl?: string | null,
): Promise<SpecialEvent> {
  const { data, error } = await supabase
    .from(EVENTS_TABLE)
    .insert([
      {
        title: payload.title,
        subtitle: payload.subtitle,
        description: payload.description,
        button_text: payload.button_text ?? "View Details",
        redirect_url: payload.redirect_url?.trim() || null,
        is_active: payload.is_active ?? true,
        sort_order: payload.sort_order ?? (await getNextSortOrder()),
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (imageUrl?.trim()) {
    await supabase.from(IMAGES_TABLE).insert([
      { event_id: data.id, image_url: imageUrl.trim(), sort_order: 0 },
    ]);
  }

  const events = await fetchEvents({ includeInactive: true });
  const created = events.find((e) => e.id === data.id);
  if (!created) throw new Error("Failed to load created event");
  return created;
}

export async function updateEvent(id: string, payload: SpecialEventUpdate): Promise<void> {
  const { error } = await supabase.from(EVENTS_TABLE).update(payload).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteEvent(id: string): Promise<void> {
  await supabase.from(IMAGES_TABLE).delete().eq("event_id", id);
  const { error } = await supabase.from(EVENTS_TABLE).delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function replaceEventImage(eventId: string, imageUrl: string): Promise<void> {
  await supabase.from(IMAGES_TABLE).delete().eq("event_id", eventId);
  const { error } = await supabase
    .from(IMAGES_TABLE)
    .insert([{ event_id: eventId, image_url: imageUrl.trim(), sort_order: 0 }]);
  if (error) throw new Error(error.message);
}

export async function uploadEventImage(file: File): Promise<string> {
  assertImageUploadAllowed(file);
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function fetchActiveEventCount(): Promise<number> {
  const { count, error } = await supabase
    .from(EVENTS_TABLE)
    .select("*", { count: "exact", head: true })
    .eq("is_active", true);

  if (error) throw new Error(error.message);
  return count ?? 0;
}
