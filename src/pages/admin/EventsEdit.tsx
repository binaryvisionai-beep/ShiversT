import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  ImagePlus,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  createEvent,
  deleteEvent,
  fetchEvents,
  replaceEventImage,
  updateEvent,
  uploadEventImage,
} from "@/lib/supabase/events";
import { eventFormSchema, type EventFormValues } from "@/lib/validations/events";
import type { SpecialEvent } from "@/types/events";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";


const PAGE_SIZE = 8;

const blankForm = (): EventFormValues => ({
  title: "",
  subtitle: "",
  description: "",
  button_text: "View Details",
  redirect_url: "",
  sort_order: 1,
  is_active: true,
});

type SpecialEventsPanelProps = {
  embedded?: boolean;
};

export function SpecialEventsPanel({ embedded = false }: SpecialEventsPanelProps) {
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);
  // const [uploading, setUploading] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialEvent | null>(null);
  const [form, setForm] = useState<EventFormValues>(blankForm());
  // const [imageUrl, setImageUrl] = useState("");
  // const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
const [uploading, setUploading] = useState(false);


  const [formErrors, setFormErrors] = useState<Partial<Record<keyof EventFormValues, string>>>({});

  const [deleteTarget, setDeleteTarget] = useState<SpecialEvent | null>(null);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchEvents({ includeInactive: true, search });
      setEvents(data);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadEvents();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadEvents]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));

  const paginatedEvents = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return events.slice(start, start + PAGE_SIZE);
  }, [events, page]);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm());
    // setImageUrl("");
    // setImagePreview(null);
    setImageUrls([]);
    setFormErrors({});
    setEditorOpen(true);
  };

  const openEdit = (ev: SpecialEvent) => {
    setEditing(ev);
    setForm({
      title: ev.title,
      subtitle: ev.subtitle,
      description: ev.description,
      button_text: ev.button_text || "View Details",
      redirect_url: ev.redirect_url ?? "",
      sort_order: ev.sort_order,
      is_active: ev.is_active,
    });
    // setImageUrl(ev.images[0]?.image_url ?? "");
    // setImagePreview(ev.images[0]?.image_url ?? null);
    setImageUrls(ev.images.map((img) => img.image_url));
    setFormErrors({});
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
    setForm(blankForm());
    // setImageUrl("");
    // setImagePreview(null);
    setImageUrls([]);
    setFormErrors({});
  };

  // const handleImageFile = async (file: File) => {
  //   setUploading(true);
  //   try {
  //     const url = await uploadEventImage(file);
  //     setImageUrl(url);
  //     setImagePreview(url);
  //     toast.success("Image uploaded");
  //   } catch (e) {
  //     toast.error(e instanceof Error ? e.message : "Upload failed");
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const handleImageFile = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadEventImage(file);
      setImageUrls((prev) => [...prev, url]);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };



  const validateForm = (): boolean => {
    const result = eventFormSchema.safeParse(form);
    if (!result.success) {
      const errors: Partial<Record<keyof EventFormValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof EventFormValues;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFormErrors(errors);
      return false;
    }
    setFormErrors({});
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSaving(true);
    try {
      if (editing) {
        await updateEvent(editing.id, {
          title: form.title,
          subtitle: form.subtitle,
          description: form.description,
          button_text: form.button_text,
          redirect_url: form.redirect_url.trim() || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        });
        // if (imageUrl.trim()) {
        //   await replaceEventImage(editing.id, imageUrl.trim());
        // }


        if (imageUrls.length > 0) {
          await supabase.from("events_special_event_images").delete().eq("event_id", editing.id);
          for (let i = 0; i < imageUrls.length; i++) {
            await supabase.from("events_special_event_images").insert({ event_id: editing.id, image_url: imageUrls[i], sort_order: i });
          }
        }

        toast.success("Event card updated");
      // } else {
      //   await createEvent(
      //     {
      //       title: form.title,
      //       subtitle: form.subtitle,
      //       description: form.description,
      //       button_text: form.button_text,
      //       redirect_url: form.redirect_url.trim() || null,
      //       sort_order: form.sort_order,
      //       is_active: form.is_active,
      //     },
      //     // imageUrl.trim() || null,
      //     imageUrls[0] ?? null,

      //   );
      //   toast.success("Event card created");
      // }

    } else {
      const newEvent = await createEvent(
        {
          title: form.title,
          subtitle: form.subtitle,
          description: form.description,
          button_text: form.button_text,
          redirect_url: form.redirect_url.trim() || null,
          sort_order: form.sort_order,
          is_active: form.is_active,
        },
        imageUrls[0] ?? null,
      );
      for (let i = 1; i < imageUrls.length; i++) {
        await supabase.from("events_special_event_images").insert({
          event_id: newEvent.id,
          image_url: imageUrls[i],
          sort_order: i,
        });
      }
      toast.success("Event card created");
    }


      closeEditor();
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEvent(deleteTarget.id);
      toast.success("Event card deleted");
      setDeleteTarget(null);
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const toggleActive = async (ev: SpecialEvent) => {
    try {
      await updateEvent(ev.id, { is_active: !ev.is_active });
      setEvents((prev) =>
        prev.map((e) => (e.id === ev.id ? { ...e, is_active: !e.is_active } : e)),
      );
      toast.success(ev.is_active ? "Hidden from website" : "Now visible on website");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  return (
    <div className={cn(embedded ? "space-y-6" : "p-6 md:p-8 space-y-8 max-w-[1400px]")}>
      {!embedded && (
        <div className="text-center space-y-2">
          <p className="text-[11px] tracking-[0.3em] uppercase text-amber-700/80 dark:text-amber-500/80">
            What We Host
          </p>
          <h1 className="text-3xl sm:text-4xl font-serif font-semibold tracking-tight">
            Our Special Events
          </h1>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Edit the event cards visitors see on the Events page. Changes go live immediately.
          </p>
        </div>
      )}

      {embedded && (
        <div>
          <h2 className="text-xl font-semibold">Special Events</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage event cards shown on the public Events page.
          </p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search event cards..."
            className="pl-9 rounded-xl"
          />
        </div>
        <Button onClick={openCreate} className="rounded-xl gap-2 shrink-0">
          <Plus className="size-4" /> Add Event Card
        </Button>
      </div>

      {/* Card grid — mirrors public website layout */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-background overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-muted" />
              <div className="p-5 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <button
          type="button"
          onClick={openCreate}
          className="w-full rounded-2xl border-2 border-dashed border-muted-foreground/25 p-16 text-center hover:border-primary/40 hover:bg-muted/30 transition-colors"
        >
          <Plus className="size-8 mx-auto text-muted-foreground mb-3" />
          <p className="font-medium">No event cards yet</p>
          <p className="text-sm text-muted-foreground mt-1">Click to add your first event card</p>
        </button>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {paginatedEvents.map((ev) => (
            <article
              key={ev.id}
              className={cn(
                "group relative rounded-xl overflow-hidden bg-background border shadow-sm hover:shadow-md transition-all",
                !ev.is_active && "opacity-60",
              )}
            >
              {/* Admin controls */}
              <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
                <span className="inline-flex items-center gap-1 rounded-md bg-black/55 text-white text-[10px] font-medium px-2 py-1 backdrop-blur-sm">
                  <GripVertical className="size-3" />
                  #{ev.sort_order}
                </span>
                {!ev.is_active && (
                  <span className="rounded-md bg-black/55 text-white text-[10px] font-medium px-2 py-1 backdrop-blur-sm">
                    Hidden
                  </span>
                )}
              </div>

              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={() => void toggleActive(ev)}
                  className="size-8 rounded-lg bg-white/95 shadow flex items-center justify-center hover:bg-white"
                  title={ev.is_active ? "Hide from website" : "Show on website"}
                >
                  {ev.is_active ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(ev)}
                  className="size-8 rounded-lg bg-white/95 shadow flex items-center justify-center hover:bg-white"
                  title="Edit card"
                >
                  <Pencil className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(ev)}
                  className="size-8 rounded-lg bg-white/95 shadow flex items-center justify-center hover:bg-white"
                  title="Delete card"
                >
                  <Trash2 className="size-3.5 text-red-500" />
                </button>
              </div>

              {/* Card preview — matches public site */}
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                {ev.images[0]?.image_url ? (
                  <img
                    src={ev.images[0].image_url}
                    alt={ev.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="p-5">
                <h3 className="font-serif text-base font-medium leading-snug">{ev.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed line-clamp-2">
                  {ev.subtitle || "—"}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-amber-700/90 dark:text-amber-500/90">
                  {ev.button_text || "View Details"} <ChevronRight size={12} />
                </span>
                {ev.redirect_url && (
                  <p className="text-[10px] text-muted-foreground mt-2 truncate" title={ev.redirect_url}>
                    → {ev.redirect_url}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {events.length > PAGE_SIZE && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.max(1, p - 1));
                }}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <PaginationItem key={p}>
                <PaginationLink
                  href="#"
                  isActive={p === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setPage(p);
                  }}
                >
                  {p}
                </PaginationLink>
              </PaginationItem>
            ))}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setPage((p) => Math.min(totalPages, p + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

      {/* Edit panel — slide-over, not bookings-style modal */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            onClick={closeEditor}
            aria-label="Close editor"
          />
          <div className="relative w-full max-w-md bg-background border-l shadow-2xl h-full overflow-y-auto">
            <div className="sticky top-0 z-10 bg-background border-b px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] tracking-[0.25em] uppercase text-amber-700/80 dark:text-amber-500/80">
                  {editing ? "Edit Card" : "New Card"}
                </p>
                <h2 className="text-lg font-semibold mt-0.5">
                  {editing ? editing.title : "Add Event Card"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeEditor}
                className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Live card preview */}
              <div className="rounded-xl overflow-hidden border bg-muted/30">
                <div className="aspect-[4/3] bg-muted overflow-hidden">
                  {/* {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" /> */}
                    {imageUrls[0] ? (
                      <img src={imageUrls[0]} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                      Card image preview
                    </div>
                  )}
                </div>
                <div className="p-4 bg-background">
                  <p className="font-serif text-sm font-medium">{form.title || "Event Title"}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.subtitle || "Short description"}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-amber-700/90">
                    {form.button_text || "View Details"} <ChevronRight size={12} />
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="event-title">Event Title *</Label>
                  <Input
                    id="event-title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Romantic Dinner"
                    className="rounded-xl"
                  />
                  {formErrors.title && (
                    <p className="text-xs text-red-500">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-subtitle">Short Description</Label>
                  <Input
                    id="event-subtitle"
                    value={form.subtitle}
                    onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                    placeholder="Shown below the title on the card"
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-description">Detailed Description</Label>
                  <textarea
                    id="event-description"
                    rows={4}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Shown when visitor opens the event modal"
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="event-redirect">Redirect Link (optional)</Label>
                  <Input
                    id="event-redirect"
                    value={form.redirect_url}
                    onChange={(e) => setForm({ ...form, redirect_url: e.target.value })}
                    placeholder="/contact or https://..."
                    className="rounded-xl"
                  />
                  {formErrors.redirect_url && (
                    <p className="text-xs text-red-500">{formErrors.redirect_url}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Leave empty to open the event detail modal on the website.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="event-button">Card Link Text</Label>
                    <Input
                      id="event-button"
                      value={form.button_text}
                      onChange={(e) => setForm({ ...form, button_text: e.target.value })}
                      placeholder="View Details"
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="event-order">Display Order</Label>
                    <Input
                      id="event-order"
                      type="number"
                      min={0}
                      value={form.sort_order}
                      onChange={(e) =>
                        setForm({ ...form, sort_order: Number(e.target.value) || 0 })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>



                {/* <div className="space-y-2">
                  <Label>Card Image</Label>
                  <div className="flex gap-2 flex-wrap">
                    <label
                      className={cn(
                        "h-9 px-3 rounded-xl border inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-muted transition-colors",
                        uploading && "opacity-50 pointer-events-none",
                      )}
                    >
                      {uploading ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <ImagePlus className="size-3.5" />
                      )}
                      {uploading ? "Uploading..." : "Upload"}
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        disabled={uploading}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleImageFile(file);
                          e.target.value = "";
                        }}
                      />
                    </label>
                    <Input
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setImagePreview(e.target.value || null);
                      }}
                      placeholder="Or paste image URL"
                      className="rounded-xl flex-1 min-w-[140px]"
                    />
                  </div>
                </div> */}

<div className="space-y-2">
  <Label>Card Images</Label>
  <div className="flex gap-2 flex-wrap">
    <label className={cn("h-9 px-3 rounded-xl border inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-muted transition-colors", uploading && "opacity-50 pointer-events-none")}>
      {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
      {uploading ? "Uploading..." : "Upload Image"}
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={uploading}
        onChange={async (e) => {
          const files = Array.from(e.target.files ?? []);
          for (const file of files) await handleImageFile(file);
          e.target.value = "";
        }}
      />
    </label>
    <Input
      placeholder="Or paste image URL and press Enter"
      className="rounded-xl flex-1 min-w-[140px]"
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const val = (e.target as HTMLInputElement).value.trim();
          if (val) { setImageUrls((prev) => [...prev, val]); (e.target as HTMLInputElement).value = ""; }
        }
      }}
    />
  </div>
  {imageUrls.length > 0 && (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {imageUrls.map((url, i) => (
        <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
          <img src={url} alt={`Image ${i + 1}`} className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => setImageUrls((prev) => prev.filter((_, idx) => idx !== i))}
            className="absolute top-1 right-1 bg-black/60 hover:bg-black/80 rounded-full p-0.5"
          >
            <X className="size-3 text-white" />
          </button>
          {i === 0 && <span className="absolute bottom-1 left-1 text-[9px] bg-black/60 text-white px-1 rounded">Cover</span>}
        </div>
      ))}
    </div>
  )}
</div>



                <div className="flex items-center gap-3 rounded-xl border px-4 py-3">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                  />
                  <div>
                    <Label className="text-sm">Visible on website</Label>
                    <p className="text-xs text-muted-foreground">Inactive cards are hidden from visitors</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 sticky bottom-0 bg-background pb-2">
                <Button
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="rounded-xl flex-1"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {editing ? "Save Card" : "Create Card"}
                </Button>
                <Button variant="outline" onClick={closeEditor} className="rounded-xl">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete event card?</AlertDialogTitle>
            <AlertDialogDescription>
              &quot;{deleteTarget?.title}&quot; will be permanently removed from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function EventsEditPage() {
  return <SpecialEventsPanel />;
}
