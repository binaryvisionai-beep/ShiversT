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
  Save,
  ImagePlus,
} from "lucide-react";
import { SpecialEventsPanel } from "@/pages/admin/EventsEdit";
import { fetchActiveEventCount } from "@/lib/supabase/events";
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

type HeroRow = {
  id: string;
  image_url: string;
};

type Tab = "enquiries" | "special" | "hero" | "analytics";

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

  const [activeEventCount, setActiveEventCount] = useState(0);

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
    loadActiveEventsCount();
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

  const loadActiveEventsCount = async () => {
    try {
      setActiveEventCount(await fetchActiveEventCount());
    } catch (error) {
      console.error(error);
    }
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
    { key: "special",   label: "Special Events" },
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
          { label: "Active Events",    value: activeEventCount,                          icon: BarChart3     },
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

      {tab === "special" && <SpecialEventsPanel embedded />}

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
