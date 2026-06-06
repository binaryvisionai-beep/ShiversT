import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Eye,
  BarChart3,
  Mail,
  Phone,
  MessageSquare,
  Trash2,
  X,
  TrendingUp,
  Plus,
  Pencil,
  ToggleLeft,
  ToggleRight,
  GripVertical,
  Save,
  ChevronDown,
  ChevronUp,
  ImagePlus,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type EventForm = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  event_name: string;
  created_at: string;
};

type PageClick = {
  id: string;
  cta: string;
  created_at: string;
};

type EventImage = {
  id: string;
  event_id: string;
  image_url: string;
  sort_order: number;
};

type SpecialEvent = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  images: EventImage[];
};

type HeroRow = {
  id: string;
  image_url: string;
};

type Tab = "enquiries" | "events" | "hero" | "analytics";

const blankEvent = (): Omit<SpecialEvent, "id" | "images"> => ({
  title: "",
  subtitle: "",
  description: "",
  is_active: true,
  sort_order: 0,
});

// ─── Upload helper ────────────────────────────────────────────────────────────
async function uploadToEvents(file: File): Promise<string | null> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("events").upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from("events").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Image upload button ──────────────────────────────────────────────────────
function UploadButton({
  onUrl,
  uploading,
  setUploading,
  label = "Upload",
}: {
  onUrl: (url: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
  label?: string;
}) {
  return (
    <label className={`h-9 px-3 rounded-xl border inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-muted transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
      {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
      {uploading ? "Uploading..." : label}
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        disabled={uploading}
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setUploading(true);
          const url = await uploadToEvents(f);
          setUploading(false);
          if (url) onUrl(url);
          e.target.value = "";
        }}
      />
    </label>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function EventsAdminPage() {
  const [tab, setTab] = useState<Tab>("enquiries");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("success");

  // Enquiries
  const [forms, setForms] = useState<EventForm[]>([]);
  const [loadingForms, setLoadingForms] = useState(true);
  const [viewing, setViewing] = useState<EventForm | null>(null);

  // Analytics
  const [clicks, setClicks] = useState<PageClick[]>([]);

  // Events
  const [events, setEvents] = useState<SpecialEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState<SpecialEvent | null>(null);
  const [newEventMode, setNewEventMode] = useState(false);
  const [newEventData, setNewEventData] = useState(blankEvent());
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [addingImageTo, setAddingImageTo] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [newEventImageUploading, setNewEventImageUploading] = useState(false);
  const [newEventImages, setNewEventImages] = useState<string[]>([]);

  // Hero
  const [hero, setHero] = useState<HeroRow | null>(null);
  const [heroUrlInput, setHeroUrlInput] = useState("");
  const [savingHero, setSavingHero] = useState(false);
  const [heroUploading, setHeroUploading] = useState(false);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(""), 3500);
  };

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadForms();
    loadClicks();
    loadEvents();
    loadHero();
  }, []);

  const loadForms = async () => {
    setLoadingForms(true);
    const { data, error } = await supabase
      .from("events_event_forms")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setForms(data || []);
    setLoadingForms(false);
  };

  const loadClicks = async () => {
    const { data } = await supabase
      .from("events_page_clicks")
      .select("*")
      .order("created_at", { ascending: false });
    setClicks(data || []);
  };

  const loadEvents = async () => {
    setLoadingEvents(true);
    const { data: evData, error } = await supabase
      .from("events_special_events")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) { console.error(error); setLoadingEvents(false); return; }

    const withImages = await Promise.all(
      (evData || []).map(async (ev) => {
        const { data: imgs } = await supabase
          .from("events_special_event_images")
          .select("*")
          .eq("event_id", ev.id)
          .order("sort_order", { ascending: true });
        return { ...ev, images: imgs || [] };
      })
    );
    setEvents(withImages);
    setLoadingEvents(false);
  };

  const loadHero = async () => {
    const { data } = await supabase
      .from("events_page_hero")
      .select("*")
      .limit(1)
      .single();
    if (data) { setHero(data); setHeroUrlInput(data.image_url); }
  };

  // ── Enquiries ────────────────────────────────────────────────────────────────
  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    const { error } = await supabase.from("events_event_forms").delete().eq("id", id);
    if (error) { notify("Failed to delete", "error"); return; }
    setForms((prev) => prev.filter((f) => f.id !== id));
    if (viewing?.id === id) setViewing(null);
    notify("Enquiry deleted");
  };

  // ── Events CRUD ──────────────────────────────────────────────────────────────
  const saveNewEvent = async () => {
    if (!newEventData.title) { notify("Title is required", "error"); return; }
    setSavingEvent(true);
    const { data, error } = await supabase
      .from("events_special_events")
      .insert([{ ...newEventData, sort_order: events.length + 1 }])
      .select()
      .single();
    if (error) { notify("Failed to create event", "error"); setSavingEvent(false); return; }

    // Save any pre-uploaded images
    if (newEventImages.length > 0) {
      await Promise.all(
        newEventImages.map((url, i) =>
          supabase.from("events_special_event_images").insert([{
            event_id: data.id, image_url: url, sort_order: i,
          }])
        )
      );
    }
    setSavingEvent(false);
    await loadEvents();
    setNewEventMode(false);
    setNewEventData(blankEvent());
    setNewEventImages([]);
    notify("Event created");
  };

  const saveEditEvent = async () => {
    if (!editingEvent) return;
    setSavingEvent(true);
    const { error } = await supabase
      .from("events_special_events")
      .update({
        title: editingEvent.title,
        subtitle: editingEvent.subtitle,
        description: editingEvent.description,
        is_active: editingEvent.is_active,
        sort_order: editingEvent.sort_order,
      })
      .eq("id", editingEvent.id);
    setSavingEvent(false);
    if (error) { notify("Failed to save", "error"); return; }
    setEvents((prev) => prev.map((e) => e.id === editingEvent.id ? { ...editingEvent } : e));
    setEditingEvent(null);
    notify("Event saved");
  };

  const toggleActive = async (ev: SpecialEvent) => {
    const { error } = await supabase
      .from("events_special_events")
      .update({ is_active: !ev.is_active })
      .eq("id", ev.id);
    if (error) { notify("Failed to update", "error"); return; }
    setEvents((prev) => prev.map((e) => e.id === ev.id ? { ...e, is_active: !e.is_active } : e));
    notify(ev.is_active ? "Event hidden from site" : "Event now visible on site");
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("Delete this event and all its images?")) return;
    await supabase.from("events_special_event_images").delete().eq("event_id", id);
    const { error } = await supabase.from("events_special_events").delete().eq("id", id);
    if (error) { notify("Failed to delete", "error"); return; }
    setEvents((prev) => prev.filter((e) => e.id !== id));
    notify("Event deleted");
  };

  // ── Images ────────────────────────────────────────────────────────────────────
  const addImageUrl = async (eventId: string, url: string) => {
    const { data, error } = await supabase
      .from("events_special_event_images")
      .insert([{ event_id: eventId, image_url: url.trim(), sort_order: 0 }])
      .select()
      .single();
    if (error) { notify("Failed to add image", "error"); return; }
    setEvents((prev) => prev.map((e) =>
      e.id === eventId ? { ...e, images: [...e.images, data] } : e
    ));
    setImageUrlInput("");
    setAddingImageTo(null);
    notify("Image added");
  };

  const deleteImage = async (imageId: string, eventId: string) => {
    const { error } = await supabase.from("events_special_event_images").delete().eq("id", imageId);
    if (error) { notify("Failed to delete image", "error"); return; }
    setEvents((prev) => prev.map((e) =>
      e.id === eventId ? { ...e, images: e.images.filter((i) => i.id !== imageId) } : e
    ));
    notify("Image removed");
  };

  // ── Hero ──────────────────────────────────────────────────────────────────────
  const saveHero = async (url: string) => {
    if (!url.trim()) return;
    setSavingHero(true);
    if (hero) {
      const { error } = await supabase
        .from("events_page_hero")
        .update({ image_url: url.trim() })
        .eq("id", hero.id);
      if (error) { notify("Failed to save hero", "error"); setSavingHero(false); return; }
      setHero({ ...hero, image_url: url.trim() });
    } else {
      const { data, error } = await supabase
        .from("events_page_hero")
        .insert([{ image_url: url.trim() }])
        .select()
        .single();
      if (error) { notify("Failed to save hero", "error"); setSavingHero(false); return; }
      setHero(data);
    }
    setHeroUrlInput(url.trim());
    setSavingHero(false);
    notify("Hero image saved");
  };

  // ── Analytics ─────────────────────────────────────────────────────────────────
  const ctaSummary = clicks.reduce((acc, c) => {
    acc[c.cta] = (acc[c.cta] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const thisMonthForms = forms.filter(
    (f) => new Date(f.created_at).getMonth() === new Date().getMonth()
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "enquiries", label: "Enquiries" },
    { key: "events",    label: "Manage Events" },
    { key: "hero",      label: "Hero Image" },
    { key: "analytics", label: "Analytics" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Events Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage events, view enquiries, upload images and track page interactions.
          </p>
        </div>
        {message && (
          <div className={`flex items-center gap-2 text-sm shrink-0 ${messageType === "success" ? "text-green-600" : "text-red-500"}`}>
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Enquiries",  value: forms.length,                              icon: MessageSquare },
          { label: "This Month",       value: thisMonthForms.length,                     icon: TrendingUp    },
          { label: "Active Events",    value: events.filter((e) => e.is_active).length,  icon: BarChart3     },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <h2 className="text-3xl font-semibold mt-2">{value}</h2>
              </div>
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 flex-wrap border-b overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── ENQUIRIES ────────────────────────────────────────────────────────── */}
      {tab === "enquiries" && (
        <div className="rounded-3xl border bg-background p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Event Enquiries</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted via the "Plan Your Event" form on the main site.
            </p>
          </div>

          {loadingForms ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          ) : forms.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="text-muted-foreground text-sm">No enquiries yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/40">
                  <tr>
                    {["Name", "Event", "Email", "Phone", "Date", "Actions"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {forms.map((f) => (
                    <tr key={f.id} className="border-t hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{f.name || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{f.event_name || "General"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.email || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.phone || "—"}</td>
                      <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                        {new Date(f.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewing(f)}
                            className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Eye className="size-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteEnquiry(f.id)}
                            className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                          >
                            <Trash2 className="size-3.5 text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MANAGE EVENTS ─────────────────────────────────────────────────────── */}
      {tab === "events" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-xl font-semibold">Special Events</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Add, edit and manage events shown on the main site.
              </p>
            </div>
            <button
              onClick={() => { setNewEventMode(true); setEditingEvent(null); }}
              className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="size-4" /> Add Event
            </button>
          </div>

          {/* New event form */}
          {newEventMode && (
            <div className="rounded-3xl border bg-background p-6 space-y-4">
              <h3 className="font-semibold">New Event</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({ ...newEventData, title: e.target.value })}
                    placeholder="e.g. Romantic Dinner"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Subtitle</label>
                  <input
                    className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                    value={newEventData.subtitle}
                    onChange={(e) => setNewEventData({ ...newEventData, subtitle: e.target.value })}
                    placeholder="Short tagline"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                <textarea
                  rows={3}
                  className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-background"
                  value={newEventData.description}
                  onChange={(e) => setNewEventData({ ...newEventData, description: e.target.value })}
                  placeholder="Brief description shown in the modal"
                />
              </div>

              {/* Images for new event */}
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Images</label>
                {newEventImages.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-2">
                    {newEventImages.map((url, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                        <img src={url} alt="" className="h-full w-full object-cover" />
                        <button
                          onClick={() => setNewEventImages((prev) => prev.filter((_, j) => j !== i))}
                          className="absolute top-1 right-1 size-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="size-3 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2 flex-wrap">
                  <UploadButton
                    uploading={newEventImageUploading}
                    setUploading={setNewEventImageUploading}
                    label="Upload Image"
                    onUrl={(url) => setNewEventImages((prev) => [...prev, url])}
                  />
                  <div className="flex gap-2 flex-1 min-w-0">
                    <input
                      className="flex-1 min-w-0 border rounded-xl px-3 py-2 text-sm focus:outline-none bg-background"
                      placeholder="Or paste image URL"
                      value={imageUrlInput}
                      onChange={(e) => setImageUrlInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && imageUrlInput.trim()) {
                          setNewEventImages((prev) => [...prev, imageUrlInput.trim()]);
                          setImageUrlInput("");
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (imageUrlInput.trim()) {
                          setNewEventImages((prev) => [...prev, imageUrlInput.trim()]);
                          setImageUrlInput("");
                        }
                      }}
                      className="h-9 px-3 rounded-xl border text-sm hover:bg-muted transition-colors shrink-0"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm text-muted-foreground">Active on site</label>
                <button onClick={() => setNewEventData({ ...newEventData, is_active: !newEventData.is_active })}>
                  {newEventData.is_active
                    ? <ToggleRight className="size-6 text-primary" />
                    : <ToggleLeft className="size-6 text-muted-foreground" />}
                </button>
              </div>

              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={saveNewEvent}
                  disabled={savingEvent}
                  className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                >
                  {savingEvent ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save Event
                </button>
                <button
                  onClick={() => { setNewEventMode(false); setNewEventData(blankEvent()); setNewEventImages([]); }}
                  className="h-10 px-5 rounded-2xl border inline-flex items-center gap-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loadingEvents ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <p className="text-muted-foreground text-sm">No events yet. Add one above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev) => (
                <div key={ev.id} className="rounded-3xl border bg-background overflow-hidden">
                  {/* Event row header */}
                  <div className="flex items-center gap-3 px-4 py-3 flex-wrap sm:flex-nowrap">
                    <GripVertical className="size-4 text-muted-foreground shrink-0 hidden sm:block" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{ev.title}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ev.is_active ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground"}`}>
                          {ev.is_active ? "Active" : "Hidden"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ev.images.length} image{ev.images.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {ev.subtitle && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{ev.subtitle}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                      <button
                        onClick={() => toggleActive(ev)}
                        className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        title={ev.is_active ? "Hide from site" : "Show on site"}
                      >
                        {ev.is_active
                          ? <ToggleRight className="size-4 text-primary" />
                          : <ToggleLeft className="size-4 text-muted-foreground" />}
                      </button>
                      <button
                        onClick={() => { setEditingEvent({ ...ev }); setExpandedEvent(ev.id); }}
                        className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => deleteEvent(ev.id)}
                        className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </button>
                      <button
                        onClick={() => setExpandedEvent(expandedEvent === ev.id ? null : ev.id)}
                        className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                      >
                        {expandedEvent === ev.id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  {expandedEvent === ev.id && (
                    <div className="border-t px-5 py-5 space-y-5 bg-muted/20">
                      {/* Edit fields */}
                      {editingEvent?.id === ev.id && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold">Edit Details</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                              <input
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-background"
                                value={editingEvent.title}
                                onChange={(e) => setEditingEvent({ ...editingEvent, title: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="text-xs text-muted-foreground mb-1 block">Subtitle</label>
                              <input
                                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-background"
                                value={editingEvent.subtitle}
                                onChange={(e) => setEditingEvent({ ...editingEvent, subtitle: e.target.value })}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground mb-1 block">Description</label>
                            <textarea
                              rows={3}
                              className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none bg-background resize-none"
                              value={editingEvent.description}
                              onChange={(e) => setEditingEvent({ ...editingEvent, description: e.target.value })}
                            />
                          </div>
                          <div className="flex gap-3">
                            <button
                              onClick={saveEditEvent}
                              disabled={savingEvent}
                              className="h-9 px-4 rounded-xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
                            >
                              {savingEvent ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                              Save
                            </button>
                            <button
                              onClick={() => setEditingEvent(null)}
                              className="h-9 px-4 rounded-xl border inline-flex items-center text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Images */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold">Images</h4>
                        {ev.images.length === 0 ? (
                          <p className="text-xs text-muted-foreground">No images yet.</p>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {ev.images.map((img) => (
                              <div key={img.id} className="relative group rounded-xl overflow-hidden aspect-[4/3] bg-muted">
                                <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                                <button
                                  onClick={() => deleteImage(img.id, ev.id)}
                                  className="absolute top-1.5 right-1.5 size-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                                >
                                  <X className="size-3 text-red-500" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Add image: upload or URL */}
                        {addingImageTo === ev.id ? (
                          <div className="space-y-2">
                            <div className="flex gap-2 flex-wrap">
                              <UploadButton
                                uploading={imageUploading}
                                setUploading={setImageUploading}
                                label="Upload Image"
                                onUrl={(url) => addImageUrl(ev.id, url)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <input
                                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none bg-background"
                                placeholder="Or paste image URL"
                                value={imageUrlInput}
                                onChange={(e) => setImageUrlInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addImageUrl(ev.id, imageUrlInput)}
                              />
                              <button
                                onClick={() => addImageUrl(ev.id, imageUrlInput)}
                                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium shrink-0"
                              >
                                Add
                              </button>
                              <button
                                onClick={() => { setAddingImageTo(null); setImageUrlInput(""); }}
                                className="h-9 px-3 rounded-xl border text-sm shrink-0"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingImageTo(ev.id); setImageUrlInput(""); }}
                            className="h-9 px-4 rounded-xl border inline-flex items-center gap-2 text-sm hover:bg-muted transition-colors"
                          >
                            <Plus className="size-4" /> Add Image
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── HERO IMAGE ────────────────────────────────────────────────────────── */}
      {tab === "hero" && (
        <div className="rounded-3xl border bg-background p-6 space-y-5 max-w-2xl">
          <div>
            <h2 className="text-xl font-semibold">Hero Image</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This image appears at the top of the Events page on the main site.
            </p>
          </div>

          {hero?.image_url && (
            <div className="rounded-2xl overflow-hidden aspect-[16/7] bg-muted">
              <img src={hero.image_url} alt="Current hero" className="h-full w-full object-cover" />
            </div>
          )}

          <div className="space-y-3">
            {/* Upload */}
            <div>
              <label className="text-xs text-muted-foreground mb-2 block">Upload from device</label>
              <UploadButton
                uploading={heroUploading}
                setUploading={setHeroUploading}
                label="Upload Hero Image"
                onUrl={(url) => { setHeroUrlInput(url); saveHero(url); }}
              />
            </div>

            {/* Or paste URL */}
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Or paste image URL</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="https://..."
                  value={heroUrlInput}
                  onChange={(e) => setHeroUrlInput(e.target.value)}
                />
                <button
                  onClick={() => saveHero(heroUrlInput)}
                  disabled={savingHero || !heroUrlInput.trim()}
                  className="h-10 px-4 rounded-xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50 shrink-0"
                >
                  {savingHero ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ANALYTICS ─────────────────────────────────────────────────────────── */}
      {tab === "analytics" && (
        <div className="rounded-3xl border bg-background p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold">CTA Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Button clicks tracked on the Events page. Total: {clicks.length}
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">CTA Button</th>
                  <th className="text-left px-4 py-3 font-medium">Total Clicks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(ctaSummary).length === 0 ? (
                  <tr>
                    <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground text-sm">
                      No clicks recorded yet.
                    </td>
                  </tr>
                ) : (
                  Object.entries(ctaSummary)
                    .sort((a, b) => b[1] - a[1])
                    .map(([cta, count]) => (
                      <tr key={cta} className="border-t">
                        <td className="px-4 py-3">{cta}</td>
                        <td className="px-4 py-3 font-semibold">{count}</td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VIEW ENQUIRY MODAL ────────────────────────────────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Enquiry Details</h2>
              <button
                onClick={() => setViewing(null)}
                className="size-9 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium text-sm">{viewing.name || "—"}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Date Submitted</p>
                  <p className="font-medium text-sm">{new Date(viewing.created_at).toLocaleString()}</p>
                </div>
              </div>
              {viewing.event_name && (
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Event</p>
                  <p className="font-medium text-sm">{viewing.event_name}</p>
                </div>
              )}
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3" /> Email
                </p>
                <p className="font-medium text-sm">{viewing.email || "—"}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone className="size-3" /> Phone
                </p>
                <p className="font-medium text-sm">{viewing.phone || "—"}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MessageSquare className="size-3" /> Message
                </p>
                <p className="text-sm leading-relaxed">{viewing.message || "—"}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2 flex-wrap">
                <button
                  onClick={() => handleDeleteEnquiry(viewing.id)}
                  className="h-10 px-4 rounded-2xl border inline-flex items-center gap-2 text-sm hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-4 text-red-500" /> Delete
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${viewing.email}`}
                  className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="size-4" /> Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}