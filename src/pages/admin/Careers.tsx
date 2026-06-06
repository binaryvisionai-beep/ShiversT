// src/pages/admin/Careers.tsx
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  Eye,
  Trash2,
  X,
  Mail,
  Phone,
  FileText,
  Download,
  ImagePlus,
  Save,
  TrendingUp,
  Users,
  Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "new" | "reviewed" | "shortlisted" | "rejected";

type Application = {
  id: string;
  prefix: string;
  full_name: string;
  email: string;
  phone: string;
  cover_letter: string;
  file_url: string;
  file_name: string;
  status: Status;
  created_at: string;
  updated_at: string;
};

type HeroRow = { id: string; image_url: string };

type Tab = "applications" | "hero";

const STATUS_OPTIONS: { value: Status; label: string; color: string }[] = [
  { value: "new",         label: "New",         color: "bg-blue-100 text-blue-700"   },
  { value: "reviewed",    label: "Reviewed",    color: "bg-yellow-100 text-yellow-700" },
  { value: "shortlisted", label: "Shortlisted", color: "bg-green-100 text-green-700"  },
  { value: "rejected",    label: "Rejected",    color: "bg-red-100 text-red-700"      },
];

function statusColor(s: Status) {
  return STATUS_OPTIONS.find((o) => o.value === s)?.color ?? "bg-muted text-muted-foreground";
}

// ─── Upload helper ─────────────────────────────────────────────────────────────
async function uploadHeroImage(file: File): Promise<string | null> {
  const ext  = file.name.split(".").pop();
  const path = `hero-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("careers-hero").upload(path, file, { upsert: true });
  if (error) { console.error(error); return null; }
  const { data } = supabase.storage.from("careers-hero").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Signed URL refresh (resumes are private) ──────────────────────────────────
async function getSignedUrl(fileUrl: string): Promise<string> {
  // Extract storage path from existing signed URL or direct path
  try {
    const url  = new URL(fileUrl);
    const path = decodeURIComponent(url.pathname.split("/careers-resumes/")[1]?.split("?")[0] ?? "");
    if (!path) return fileUrl;
    const { data } = await supabase.storage
      .from("careers-resumes")
      .createSignedUrl(path, 60 * 60); // 1-hour fresh URL
    return data?.signedUrl ?? fileUrl;
  } catch {
    return fileUrl;
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CareersAdminPage() {
  const [tab, setTab] = useState<Tab>("applications");
  const [message, setMessage]     = useState("");
  const [msgType, setMsgType]     = useState<"success" | "error">("success");

  // Applications
  const [apps, setApps]           = useState<Application[]>([]);
  const [loading, setLoading]     = useState(true);
  const [viewing, setViewing]     = useState<Application | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [search, setSearch]       = useState("");

  // Hero
  const [hero, setHero]           = useState<HeroRow | null>(null);
  const [heroUrl, setHeroUrl]     = useState("");
  const [heroUploading, setHeroUploading] = useState(false);
  const [heroSaving, setHeroSaving]       = useState(false);

  const notify = (msg: string, type: "success" | "error" = "success") => {
    setMessage(msg); setMsgType(type);
    setTimeout(() => setMessage(""), 3500);
  };

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { loadApps(); loadHero(); }, []);

  const loadApps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("careers_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    setApps(data || []);
    setLoading(false);
  };

  const loadHero = async () => {
    const { data } = await supabase.from("careers_hero").select("*").limit(1).single();
    if (data) { setHero(data); setHeroUrl(data.image_url); }
  };

  // ── Application actions ─────────────────────────────────────────────────────
  const updateStatus = async (id: string, status: Status) => {
    const { error } = await supabase
      .from("careers_applications")
      .update({ status })
      .eq("id", id);
    if (error) { notify("Failed to update status", "error"); return; }
    setApps((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
    if (viewing?.id === id) setViewing((v) => v ? { ...v, status } : v);
    notify("Status updated");
  };

  const deleteApp = async (id: string) => {
    if (!confirm("Delete this application permanently?")) return;
    const { error } = await supabase.from("careers_applications").delete().eq("id", id);
    if (error) { notify("Failed to delete", "error"); return; }
    setApps((prev) => prev.filter((a) => a.id !== id));
    if (viewing?.id === id) setViewing(null);
    notify("Application deleted");
  };

  const handleDownload = async (app: Application) => {
    if (!app.file_url) return;
    setFileLoading(true);
    const url = await getSignedUrl(app.file_url);
    setFileLoading(false);
    window.open(url, "_blank");
  };

  // ── Hero ────────────────────────────────────────────────────────────────────
  const saveHero = async (url: string) => {
    if (!url.trim()) return;
    setHeroSaving(true);
    if (hero) {
      const { error } = await supabase
        .from("careers_hero")
        .update({ image_url: url.trim() })
        .eq("id", hero.id);
      if (error) { notify("Failed to save hero", "error"); setHeroSaving(false); return; }
      setHero({ ...hero, image_url: url.trim() });
    } else {
      const { data, error } = await supabase
        .from("careers_hero")
        .insert([{ image_url: url.trim() }])
        .select()
        .single();
      if (error) { notify("Failed to save hero", "error"); setHeroSaving(false); return; }
      setHero(data);
    }
    setHeroUrl(url.trim());
    setHeroSaving(false);
    notify("Hero image saved");
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const filtered = apps.filter((a) => {
    const matchStatus = statusFilter === "all" || a.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      a.full_name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.phone?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const stats = {
    total:       apps.length,
    new:         apps.filter((a) => a.status === "new").length,
    shortlisted: apps.filter((a) => a.status === "shortlisted").length,
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Management</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1">Careers</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Review applications, update statuses and manage the careers page hero image.
          </p>
        </div>
        {message && (
          <div className={`flex items-center gap-2 text-sm shrink-0 ${msgType === "success" ? "text-green-600" : "text-red-500"}`}>
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Applications", value: stats.total,       icon: Users     },
          { label: "New / Unreviewed",   value: stats.new,         icon: Clock     },
          { label: "Shortlisted",        value: stats.shortlisted, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-3xl mt-2">{value}</p>
              </div>
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b overflow-x-auto">
        {(["applications", "hero"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap capitalize ${
              tab === t
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "applications" ? "Applications" : "Hero Image"}
          </button>
        ))}
      </div>

      {/* ── APPLICATIONS TAB ──────────────────────────────────────────────────── */}
      {tab === "applications" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            <input
              type="search"
              placeholder="Search by name, email or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 w-full sm:w-60"
            />
            <div className="flex gap-2 flex-wrap">
              {(["all", "new", "reviewed", "shortlisted", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
              <Loader2 className="size-4 animate-spin" /> Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed p-12 text-center">
              <p className="text-muted-foreground text-sm">No applications found.</p>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                      <th className="px-4 py-3 font-medium">Applicant</th>
                      <th className="px-4 py-3 font-medium">Contact</th>
                      <th className="px-4 py-3 font-medium">File</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((app) => (
                      <tr
                        key={app.id}
                        className="border-b border-border/60 hover:bg-muted/20 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium">{app.prefix} {app.full_name}</p>
                          <p className="text-xs text-muted-foreground">{app.email}</p>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {app.phone || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {app.file_name ? (
                            <button
                              onClick={() => handleDownload(app)}
                              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                            >
                              {fileLoading
                                ? <Loader2 className="size-3 animate-spin" />
                                : <Download className="size-3" />}
                              {app.file_name.length > 20
                                ? app.file_name.slice(0, 20) + "…"
                                : app.file_name}
                            </button>
                          ) : (
                            <span className="text-xs text-muted-foreground">No file</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value as Status)}
                            className={`text-xs rounded-full px-2 py-1 border-0 font-medium focus:outline-none cursor-pointer ${statusColor(app.status)}`}
                          >
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(app.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setViewing(app)}
                              className="size-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            <button
                              onClick={() => deleteApp(app.id)}
                              className="size-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors"
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

              {/* Mobile cards */}
              <div className="md:hidden divide-y divide-border">
                {filtered.map((app) => (
                  <div key={app.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium text-sm">{app.prefix} {app.full_name}</p>
                        <p className="text-xs text-muted-foreground">{app.email}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColor(app.status)}`}>
                        {app.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(app.created_at).toLocaleDateString()}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setViewing(app)}
                        className="h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1 hover:bg-muted transition-colors"
                      >
                        <Eye className="size-3.5" /> View
                      </button>
                      {app.file_name && (
                        <button
                          onClick={() => handleDownload(app)}
                          className="h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1 hover:bg-muted transition-colors"
                        >
                          <Download className="size-3.5" /> File
                        </button>
                      )}
                      <button
                        onClick={() => deleteApp(app.id)}
                        className="h-8 px-3 rounded-lg border text-xs inline-flex items-center gap-1 text-red-500 hover:bg-muted transition-colors ml-auto"
                      >
                        <Trash2 className="size-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── HERO TAB ──────────────────────────────────────────────────────────── */}
      {tab === "hero" && (
        <div className="rounded-2xl border border-border bg-card p-6 space-y-5 max-w-2xl shadow-soft">
          <div>
            <h2 className="text-xl font-semibold">Hero Image</h2>
            <p className="text-sm text-muted-foreground mt-1">
              This image appears at the top of the Careers page on the main site.
            </p>
          </div>

          {hero?.image_url && (
            <div className="rounded-xl overflow-hidden aspect-[16/7] bg-muted">
              <img src={hero.image_url} alt="Current hero" className="h-full w-full object-cover" />
            </div>
          )}

          {/* Upload */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Upload from device</label>
            <label className={`h-9 px-3 rounded-xl border inline-flex items-center gap-2 text-sm cursor-pointer hover:bg-muted transition-colors ${heroUploading ? "opacity-50 pointer-events-none" : ""}`}>
              {heroUploading ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
              {heroUploading ? "Uploading..." : "Upload Image"}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={heroUploading}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setHeroUploading(true);
                  const url = await uploadHeroImage(f);
                  setHeroUploading(false);
                  if (url) { setHeroUrl(url); saveHero(url); }
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          {/* Or URL */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Or paste image URL</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                placeholder="https://..."
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
              />
              <button
                onClick={() => saveHero(heroUrl)}
                disabled={heroSaving || !heroUrl.trim()}
                className="h-10 px-4 rounded-xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50 shrink-0"
              >
                {heroSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── APPLICATION DETAIL MODAL ──────────────────────────────────────────── */}
      <AnimatePresence>
        {viewing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
            onClick={() => setViewing(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-background border max-h-[92vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Application Details</h2>
                <button
                  onClick={() => setViewing(null)}
                  className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                {/* Name + status */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Applicant</p>
                    <p className="font-medium text-sm">{viewing.prefix} {viewing.full_name}</p>
                  </div>
                  <div className="rounded-2xl border p-4 space-y-1">
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-sm">{new Date(viewing.created_at).toLocaleString()}</p>
                  </div>
                </div>

                {/* Email */}
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" /> Email
                  </p>
                  <p className="font-medium text-sm">{viewing.email}</p>
                </div>

                {/* Phone */}
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" /> Phone
                  </p>
                  <p className="font-medium text-sm">{viewing.phone || "—"}</p>
                </div>

                {/* Cover letter */}
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="size-3" /> Cover Letter
                  </p>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {viewing.cover_letter || "—"}
                  </p>
                </div>

                {/* File */}
                <div className="rounded-2xl border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Uploaded File</p>
                  {viewing.file_name ? (
                    <button
                      onClick={() => handleDownload(viewing)}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary/10 text-primary px-4 py-2 text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      {fileLoading
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Download className="size-4" />}
                      {viewing.file_name}
                    </button>
                  ) : (
                    <p className="text-sm text-muted-foreground">No file uploaded</p>
                  )}
                </div>

                {/* Status update */}
                <div className="rounded-2xl border p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">Update Status</p>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map((o) => (
                      <button
                        key={o.value}
                        onClick={() => updateStatus(viewing.id, o.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                          viewing.status === o.value
                            ? `${o.color} border-transparent`
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => deleteApp(viewing.id)}
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}