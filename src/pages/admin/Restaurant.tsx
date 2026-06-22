import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  format,
  formatDistanceToNow,
  isToday,
  isWithinInterval,
  parseISO,
  subDays,
} from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import {
  Filter,
  Loader2,
  Search,
  SlidersHorizontal,
  Trash2,
  UtensilsCrossed,
  X,
  ImagePlus,
  Save,
  ChevronDown,
  ChevronUp,
  Plus,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { ReservationDetailPanel } from "@/components/admin/reservations/reservation-detail-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { DateRangePreset } from "@/lib/bookings/types";
import { mapDbRowToReservation } from "@/lib/reservations/map-reservation";
import { RESTAURANT_TABLES, ZONE_LABELS } from "@/lib/reservations/tables";
import { formatTimeSlot } from "@/lib/reservations/time-slots";
import type { Reservation, RestaurantReservation } from "@/lib/reservations/types";
import { supabase } from "@/lib/supabase";
import { getImageUploadError } from "@/lib/validate-image-upload";
import { cn } from "@/lib/utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const CMS_ROW_ID = "00000000-0000-0000-0000-000000000002";

type SortOption = "newest" | "oldest" | "name" | "visit";
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled" | "completed";

const STATUS_OPTIONS: StatusFilter[] = ["pending", "confirmed", "cancelled", "completed"];

// ─── CMS image fields grouped by section ─────────────────────────────────────
const CMS_GROUPS = [
  {
    key: "hero",
    label: "Hero Image",
    fields: [{ key: "hero_image", label: "Hero" }],
  },
  {
    key: "goan",
    label: "Goan Cuisine",
    fields: [
      { key: "goan_image_1", label: "Goan 1" },
      { key: "goan_image_2", label: "Goan 2" },
      { key: "goan_image_3", label: "Goan 3" },
      { key: "goan_image_4", label: "Goan 4" },
    ],
    textFields: [
      { key: "goan_title", label: "Title" },
      { key: "goan_subtitle", label: "Subtitle" },
      { key: "goan_description", label: "Description", multiline: true },
    ],
  },
  {
    key: "oriental",
    label: "Oriental Cuisine",
    fields: [
      { key: "oriental_image_1", label: "Oriental 1" },
      { key: "oriental_image_2", label: "Oriental 2" },
      { key: "oriental_image_3", label: "Oriental 3" },
      { key: "oriental_image_4", label: "Oriental 4" },
    ],
    textFields: [
      { key: "oriental_title", label: "Title" },
      { key: "oriental_subtitle", label: "Subtitle" },
      { key: "oriental_description", label: "Description", multiline: true },
    ],
  },
  {
    key: "northeast",
    label: "Northeast Cuisine",
    fields: [
      { key: "northeast_image_1", label: "NE 1" },
      { key: "northeast_image_2", label: "NE 2" },
      { key: "northeast_image_3", label: "NE 3" },
      { key: "northeast_image_4", label: "NE 4" },
    ],
    textFields: [
      { key: "northeast_title", label: "Title" },
      { key: "northeast_subtitle", label: "Subtitle" },
      { key: "northeast_description", label: "Description", multiline: true },
    ],
  },
  {
    key: "continental",
    label: "Continental Cuisine",
    fields: [
      { key: "continental_image_1", label: "Continental 1" },
      { key: "continental_image_2", label: "Continental 2" },
      { key: "continental_image_3", label: "Continental 3" },
      { key: "continental_image_4", label: "Continental 4" },
    ],
    textFields: [
      { key: "continental_title", label: "Title" },
      { key: "continental_subtitle", label: "Subtitle" },
      { key: "continental_description", label: "Description", multiline: true },
    ],
  },
  {
    key: "insta",
    label: "Instagram Feed",
    fields: [
      { key: "insta_image_1", label: "Insta 1" },
      { key: "insta_image_2", label: "Insta 2" },
      { key: "insta_image_3", label: "Insta 3" },
      { key: "insta_image_4", label: "Insta 4" },
      { key: "insta_image_5", label: "Insta 5" },
      { key: "insta_image_6", label: "Insta 6" },
    ],
  },
];

// ─── Motion variants ──────────────────────────────────────────────────────────
const listVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.06 } },
};

const rowVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.18 } },
};

const selectTriggerClass =
  "h-9 rounded-lg text-sm shrink-0 w-full sm:w-auto sm:min-w-[7.5rem] lg:min-w-0";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function normalizeStatus(s: string) { return s.toLowerCase(); }

function inDateRange(visitDate: string, preset: DateRangePreset): boolean {
  if (preset === "all") return true;
  const d = parseISO(visitDate);
  const now = new Date();
  if (preset === "today") return isToday(d);
  if (preset === "7d") return isWithinInterval(d, { start: subDays(now, 7), end: now });
  if (preset === "30d") return isWithinInterval(d, { start: subDays(now, 30), end: now });
  return true;
}

function getGuestName(row: RestaurantReservation) {
  return row.guest_name || row.customer_name || "—";
}

function getGuestPhone(row: RestaurantReservation) {
  return row.guest_phone || row.customer_phone || "";
}

function formatTableDisplay(row: RestaurantReservation) {
  const meta = RESTAURANT_TABLES.find(
    (t) => t.id.toLowerCase() === (row.table_id ?? "").toLowerCase(),
  );
  const name = meta?.name ?? row.table_label ?? row.table_id ?? "—";
  const zoneKey = meta?.zone ?? row.table_zone;
  const zone = zoneKey
    ? ZONE_LABELS[zoneKey] ?? zoneKey.charAt(0).toUpperCase() + zoneKey.slice(1)
    : null;
  const seats = meta?.seats ?? row.table_seats;
  const sub =
    zone && seats ? `${zone} · ${seats} seats`
    : zone ? zone
    : seats ? `${seats} seats`
    : null;
  return { name, sub };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const s = normalizeStatus(status);
  const map: Record<string, string> = {
    confirmed: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-gold/15 text-bronze border-gold/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    completed: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("rounded-full font-normal capitalize", map[s] ?? "")}>
      <span className="size-1.5 rounded-full bg-current mr-1.5" />
      {s}
    </Badge>
  );
}

function StatCard({ label, description, value, accent }: {
  label: string; description: string; value: number; accent?: "amber";
}) {
  return (
    <div className={cn(
      "rounded-2xl border border-border p-4 text-left shadow-soft w-full bg-card",
      accent === "amber" && "bg-gradient-to-br from-primary/6 to-card",
    )}>
      <p className="text-sm font-medium leading-tight">{label}</p>
      <p className="font-display text-2xl sm:text-3xl mt-2">{value}</p>
      <p className="text-xs text-muted-foreground mt-1.5 leading-snug">{description}</p>
    </div>
  );
}

function ReservationRow({ row, mapped, selected, onSelect, onDelete }: {
  row: RestaurantReservation; mapped: Reservation; selected: boolean;
  onSelect: () => void; onDelete: (e: React.MouseEvent) => void;
}) {
  const name = getGuestName(row);
  const initials = name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const table = formatTableDisplay(row);
  return (
    <motion.tr layout variants={rowVariants} onClick={onSelect}
      className={cn(
        "border-b border-border/80 cursor-pointer transition-colors hover:bg-muted/40",
        selected && "bg-primary/5",
        normalizeStatus(row.status) === "cancelled" && "opacity-60",
      )}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee shrink-0">
            {initials || "?"}
          </div>
          <div className="min-w-0">
            <p className="font-medium truncate">{name}</p>
            {getGuestPhone(row) && <p className="text-xs text-muted-foreground truncate">{getGuestPhone(row)}</p>}
            {row.reference_code && <p className="text-xs text-muted-foreground">{row.reference_code}</p>}
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5 whitespace-nowrap">
        <p className="font-medium">{format(parseISO(row.reservation_date), "EEE, d MMM")}</p>
        <p className="text-xs text-muted-foreground">{formatTimeSlot(mapped.time)}</p>
      </td>
      <td className="px-4 py-3.5 text-center">{row.guests ?? row.guest_count ?? "—"}</td>
      <td className="px-4 py-3.5 min-w-0 max-w-[180px]">
        <p className="font-medium truncate">{table.name}</p>
        {table.sub && <p className="text-xs text-muted-foreground truncate">{table.sub}</p>}
      </td>
      <td className="px-4 py-3.5"><StatusBadge status={row.status} /></td>
      <td className="px-4 py-3.5 text-muted-foreground text-xs whitespace-nowrap hidden lg:table-cell">
        {formatDistanceToNow(new Date(row.created_at), { addSuffix: true })}
      </td>
      <td className="px-4 py-3.5">
        <Button type="button" variant="ghost" size="icon"
          className="size-8 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete} aria-label="Delete reservation">
          <Trash2 className="size-4" />
        </Button>
      </td>
    </motion.tr>
  );
}

function ReservationCard({ row, mapped, selected, onSelect }: {
  row: RestaurantReservation; mapped: Reservation; selected: boolean; onSelect: () => void;
}) {
  const name = getGuestName(row);
  const initials = name.split(" ").filter(Boolean).map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const table = formatTableDisplay(row);
  return (
    <motion.button type="button" layout variants={rowVariants} onClick={onSelect}
      className={cn(
        "w-full text-left p-4 flex gap-3 border-b border-border transition-colors",
        selected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      <div className="size-10 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee shrink-0">
        {initials || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium truncate">{name}</p>
          <StatusBadge status={row.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {format(parseISO(row.reservation_date), "d MMM")} · {formatTimeSlot(mapped.time)} ·{" "}
          {row.guests ?? row.guest_count ?? "—"} guests
        </p>
        <p className="text-sm text-muted-foreground mt-1 truncate">
          {table.name}{table.sub ? ` · ${table.sub}` : ""}
        </p>
      </div>
    </motion.button>
  );
}

// ─── Signature Dishes Manager ─────────────────────────────────────────────────
type SignatureDish = { id: string; name: string; image_url: string; sort_order: number };

function SignatureDishesManager() {
  const [dishes, setDishes] = useState<SignatureDish[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [newPreview, setNewPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("signature_dishes")
        .select("*")
        .order("sort_order", { ascending: true });
      setDishes((data as SignatureDish[]) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const validationError = getImageUploadError(f);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }
    setNewFile(f);
    setNewPreview(URL.createObjectURL(f));
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newFile) {
      toast.error("Provide both a name and an image");
      return;
    }
    setUploading(true);
    try {
      const ext = newFile.name.split(".").pop();
      const path = `signature/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("restaurant")
        .upload(path, newFile, { upsert: true });
      if (upErr) throw upErr;
      const { data: urlData } = supabase.storage.from("restaurant").getPublicUrl(path);
      const { data: row, error: insertErr } = await supabase
        .from("signature_dishes")
        .insert({ name: newName.trim(), image_url: urlData.publicUrl, sort_order: dishes.length })
        .select()
        .single();
      if (insertErr) throw insertErr;
      setDishes((prev) => [...prev, row as SignatureDish]);
      setNewName("");
      setNewFile(null);
      setNewPreview(null);
      toast.success("Dish added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add dish");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dish?")) return;
    const { error } = await supabase.from("signature_dishes").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    setDishes((prev) => prev.filter((d) => d.id !== id));
    toast.success("Dish removed");
  };

  const handleRename = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from("signature_dishes")
      .update({ name: editName.trim(), updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Rename failed"); return; }
    setDishes((prev) => prev.map((d) => d.id === id ? { ...d, name: editName.trim() } : d));
    setEditingId(null);
    toast.success("Name updated");
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <UtensilsCrossed className="size-4 text-primary" />
        <span className="text-sm font-medium">Signature Dishes</span>
      </div>

      {/* Add new dish */}
      <div className="p-5 border-b border-border space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Add dish</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Dish name..."
            className="flex-1 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <label className="cursor-pointer">
            <input type="file" accept="image/*" className="sr-only" onChange={handleFileSelect} />
            <span className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm text-muted-foreground cursor-pointer">
              <ImagePlus className="size-4" />
              {newFile ? newFile.name.slice(0, 16) + "…" : "Choose image"}
            </span>
          </label>
          <Button
            size="sm"
            onClick={() => void handleAdd()}
            disabled={uploading || !newName.trim() || !newFile}
            className="rounded-lg h-9 gap-1.5"
          >
            {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add
          </Button>
        </div>
        {newPreview && (
          <img src={newPreview} alt="preview" className="h-20 w-auto rounded-lg border border-border object-cover" />
        )}
      </div>

      {/* List */}
      <div className="p-5">
        {loading ? (
          <div className="space-y-2">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
          </div>
        ) : dishes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No signature dishes yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {dishes.map((dish) => (
              <div key={dish.id} className="relative rounded-xl border border-border overflow-hidden group">
                <img
                  src={dish.image_url}
                  alt={dish.name}
                  className="w-full h-28 object-cover"
                />
                <div className="p-2 bg-card">
                  {editingId === dish.id ? (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-7 px-2 rounded-md border text-xs focus:outline-none focus:ring-1 focus:ring-primary/30"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") void handleRename(dish.id); }}
                      />
                      <button onClick={() => void handleRename(dish.id)} className="text-primary hover:text-primary/80">
                        <Check className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium truncate">{dish.name}</p>
                      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingId(dish.id); setEditName(dish.name); }}
                          className="p-1 rounded hover:bg-muted transition-colors"
                        >
                          <Pencil className="size-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={() => void handleDelete(dish.id)}
                          className="p-1 rounded hover:bg-destructive/10 transition-colors"
                        >
                          <Trash2 className="size-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Seating Sections Manager ─────────────────────────────────────────────────
type SeatingSection = {
  id: string; name: string; short_label: string;
  capacity: string; is_active: boolean; sort_order: number;
};

function SeatingSectionsManager() {
  const [sections, setSections] = useState<SeatingSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCapacity, setNewCapacity] = useState("");
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFields, setEditFields] = useState<Partial<SeatingSection>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("seating_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      setSections((data as SeatingSection[]) ?? []);
      setLoading(false);
    };
    void load();
  }, []);

  const toggleActive = async (section: SeatingSection) => {
    setSaving(section.id);
    const { error } = await supabase
      .from("seating_sections")
      .update({ is_active: !section.is_active, updated_at: new Date().toISOString() })
      .eq("id", section.id);
    if (error) { toast.error("Update failed"); }
    else {
      setSections((prev) =>
        prev.map((s) => s.id === section.id ? { ...s, is_active: !s.is_active } : s)
      );
      toast.success(section.is_active ? `${section.name} deactivated` : `${section.name} activated`);
    }
    setSaving(null);
  };

  const handleAdd = async () => {
    if (!newName.trim() || !newLabel.trim()) {
      toast.error("Name and short label are required");
      return;
    }
    setAdding(true);
    const { data, error } = await supabase
      .from("seating_sections")
      .insert({
        name: newName.trim(),
        short_label: newLabel.trim().toLowerCase(),
        capacity: newCapacity.trim() || "1–6 Pax",
        is_active: true,
        sort_order: sections.length,
      })
      .select()
      .single();
    if (error) { toast.error("Add failed"); }
    else {
      setSections((prev) => [...prev, data as SeatingSection]);
      setNewName(""); setNewLabel(""); setNewCapacity("");
      toast.success("Section added");
    }
    setAdding(false);
  };

  const handleSaveEdit = async (id: string) => {
    setSaving(id);
    const { error } = await supabase
      .from("seating_sections")
      .update({ ...editFields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Save failed"); }
    else {
      setSections((prev) => prev.map((s) => s.id === id ? { ...s, ...editFields } : s));
      setEditingId(null);
      toast.success("Section updated");
    }
    setSaving(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this section?")) return;
    const { error } = await supabase.from("seating_sections").delete().eq("id", id);
    if (error) { toast.error("Delete failed"); return; }
    setSections((prev) => prev.filter((s) => s.id !== id));
    toast.success("Section removed");
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="p-5 border-b border-border flex items-center gap-2">
        <ToggleRight className="size-4 text-primary" />
        <span className="text-sm font-medium">Seating Sections</span>
        <span className="text-xs text-muted-foreground ml-1">— toggle off for monsoon/closures</span>
      </div>

      {/* Add new section */}
      <div className="p-5 border-b border-border space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-wider">Add section</p>
        <div className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <input
            value={newName} onChange={(e) => setNewName(e.target.value)}
            placeholder="Display name (e.g. The Serene Garden)"
            className="flex-1 min-w-[180px] h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Short key (e.g. garden)"
            className="w-36 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <input
            value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)}
            placeholder="Capacity (e.g. 1–6 Pax)"
            className="w-36 h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <Button size="sm" onClick={() => void handleAdd()} disabled={adding} className="rounded-lg h-9 gap-1.5">
            {adding ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
            Add
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-border">
        {loading ? (
          <div className="p-5 space-y-2">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
          </div>
        ) : sections.map((section) => (
          <div key={section.id} className={cn(
            "flex items-center gap-3 px-5 py-3.5 transition-colors",
            !section.is_active && "opacity-50"
          )}>
            {editingId === section.id ? (
              <div className="flex-1 flex flex-wrap gap-2">
                <input
                  value={editFields.name ?? section.name}
                  onChange={(e) => setEditFields((p) => ({ ...p, name: e.target.value }))}
                  className="flex-1 min-w-[140px] h-8 px-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                <input
                  value={editFields.capacity ?? section.capacity}
                  onChange={(e) => setEditFields((p) => ({ ...p, capacity: e.target.value }))}
                  className="w-32 h-8 px-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-primary/30"
                  placeholder="Capacity"
                />
                <Button size="sm" onClick={() => void handleSaveEdit(section.id)} disabled={saving === section.id} className="h-8 rounded-lg gap-1">
                  {saving === section.id ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingId(null)} className="h-8 rounded-lg">Cancel</Button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{section.name}</p>
                  <p className="text-xs text-muted-foreground">{section.capacity} · key: {section.short_label}</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => { setEditingId(section.id); setEditFields({}); }}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                  >
                    <Pencil className="size-3.5 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => void toggleActive(section)}
                    disabled={saving === section.id}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title={section.is_active ? "Deactivate" : "Activate"}
                  >
                    {section.is_active
                      ? <ToggleRight className="size-4 text-primary" />
                      : <ToggleLeft className="size-4 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => void handleDelete(section.id)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CMS Image + Text Manager ─────────────────────────────────────────────────
function CmsImageManager() {
  const [cmsData, setCmsData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setCmsLoading] = useState(true);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ hero: true });
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("restaurant_content")
        .select("*")
        .eq("id", CMS_ROW_ID)
        .single();
      if (data) setCmsData(data as Record<string, string>);
      setCmsLoading(false);
    };
    void load();
  }, []);

  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleUrlChange = (field: string, value: string) =>
    setCmsData((prev) => ({ ...prev, [field]: value }));

  const handleFileUpload = async (field: string, file: File) => {
    const validationError = getImageUploadError(file);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setUploading((prev) => ({ ...prev, [field]: true }));
    try {
      const ext = file.name.split(".").pop();
      const path = `${field}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("restaurant")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from("restaurant").getPublicUrl(path);
      handleUrlChange(field, urlData.publicUrl);
      toast.success("Image uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("restaurant_content")
        .update({ ...cmsData, updated_at: new Date().toISOString() })
        .eq("id", CMS_ROW_ID);
      if (error) throw error;
      toast.success("Restaurant content saved");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="space-y-3 p-6">
        {[1,2,3].map((i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    );

  return (
    <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImagePlus className="size-4 text-primary" />
          <span className="text-sm font-medium">Restaurant Content</span>
        </div>
        <Button size="sm" className="rounded-xl h-9 gap-2" onClick={() => void handleSave()} disabled={saving}>
          {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save
        </Button>
      </div>

      <div className="divide-y divide-border">
        {CMS_GROUPS.map((group) => (
          <div key={group.key}>
            <button
              onClick={() => toggleGroup(group.key)}
              className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
            >
              <span className="text-sm font-medium">{group.label}</span>
              {openGroups[group.key]
                ? <ChevronUp className="size-4 text-muted-foreground" />
                : <ChevronDown className="size-4 text-muted-foreground" />}
            </button>

            <AnimatePresence initial={false}>
              {openGroups[group.key] && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="px-5 pb-5 space-y-5">
                    {/* Text fields (speciality sections only) */}
                    {"textFields" in group && group.textFields && (
                      <div className="space-y-3 pt-2">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">Text content</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {group.textFields.map(({ key, label, multiline }) => (
                            <div key={key} className={cn("space-y-1", multiline && "sm:col-span-2")}>
                              <Label className="text-xs text-muted-foreground">{label}</Label>
                              {multiline ? (
                                <textarea
                                  value={(cmsData[key] as string) ?? ""}
                                  onChange={(e) => handleUrlChange(key, e.target.value)}
                                  rows={3}
                                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={(cmsData[key] as string) ?? ""}
                                  onChange={(e) => handleUrlChange(key, e.target.value)}
                                  className="w-full h-9 px-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Image fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      {group.fields.map(({ key, label }) => (
                        <div key={key} className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">{label}</Label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={(cmsData[key] as string) ?? ""}
                              onChange={(e) => handleUrlChange(key, e.target.value)}
                              placeholder="Paste image URL..."
                              className="flex-1 h-9 px-3 rounded-lg border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 min-w-0"
                            />
                            <label className="cursor-pointer">
                              <input
                                type="file" accept="image/*" className="sr-only"
                                onChange={(e) => {
                                  const f = e.target.files?.[0];
                                  if (f) void handleFileUpload(key, f);
                                }}
                              />
                              <span className={cn(
                                "inline-flex items-center justify-center h-9 w-9 rounded-lg border border-border bg-background hover:bg-muted transition-colors",
                                uploading[key] && "opacity-50 pointer-events-none"
                              )}>
                                {uploading[key]
                                  ? <Loader2 className="size-3.5 animate-spin" />
                                  : <ImagePlus className="size-3.5 text-muted-foreground" />}
                              </span>
                            </label>
                          </div>
                          {(cmsData[key] as string) && (
                            <img
                              src={cmsData[key] as string}
                              alt={label}
                              className="h-16 w-full object-cover rounded-lg border border-border"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Admin Page ──────────────────────────────────────────────────────────
export default function RestaurantAdminPage() {
  const [rows, setRows] = useState<RestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<RestaurantReservation | null>(null);
  const [updating, setUpdating] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRangePreset>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("newest");
  const [showFilters, setShowFilters] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("restaurant_reservations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setRows((data as RestaurantReservation[]) ?? []);
    } catch (e) {
      console.error(e);
      toast.error("Could not load reservations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const mappedById = useMemo(() => {
    const map = new Map<string, Reservation>();
    for (const row of rows) map.set(row.id, mapDbRowToReservation(row));
    return map;
  }, [rows]);

  const stats = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    return {
      total:     rows.length,
      today:     rows.filter((r) => r.reservation_date === todayStr).length,
      confirmed: rows.filter((r) => normalizeStatus(r.status) === "confirmed").length,
      pending:   rows.filter((r) => normalizeStatus(r.status) === "pending").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = rows.filter((r) => {
      if (!inDateRange(r.reservation_date, dateRange)) return false;
      if (statusFilter !== "all" && normalizeStatus(r.status) !== statusFilter) return false;
      if (q) {
        const name = getGuestName(r).toLowerCase();
        const phone = getGuestPhone(r).toLowerCase();
        if (!name.includes(q) && !phone.includes(q)) return false;
      }
      return true;
    });

    list = [...list].sort((a, b) => {
      if (sort === "name")   return getGuestName(a).localeCompare(getGuestName(b));
      if (sort === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sort === "visit") {
        const da = `${a.reservation_date}T${a.reservation_time ?? "00:00"}`;
        const db = `${b.reservation_date}T${b.reservation_time ?? "00:00"}`;
        return da.localeCompare(db);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [rows, search, dateRange, statusFilter, sort]);

  const hasActiveFilters =
    search.trim() !== "" || dateRange !== "all" || statusFilter !== "all" || sort !== "newest";

  const clearFilters = () => {
    setSearch(""); setDateRange("all"); setStatusFilter("all"); setSort("newest");
  };

  const selectedReservation = selected ? mappedById.get(selected.id) : null;
  const openDetail = (row: RestaurantReservation) => { setSelected(row); setSheetOpen(true); };

  const refreshRow = (updated: RestaurantReservation) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setSelected(updated);
  };

  const handleStatusChange = async (status: string) => {
    if (!selected) return;
    setUpdating(true);
    try {
      const { data, error } = await supabase
        .from("restaurant_reservations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", selected.id)
        .select()
        .single();
      if (error) throw error;
      refreshRow(data as RestaurantReservation);
      toast.success("Status updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reservation permanently?")) return;
    try {
      const { error } = await supabase.from("restaurant_reservations").delete().eq("id", id);
      if (error) throw error;
      setRows((prev) => prev.filter((r) => r.id !== id));
      if (selected?.id === id) { setSelected(null); setSheetOpen(false); }
      toast.success("Reservation deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full overflow-x-hidden">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between min-w-0"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Management</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1">Restaurant</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Table reservations and restaurant content management.
          </p>
        </div>
        <Button variant="outline" className="rounded-xl h-11 shrink-0" onClick={() => void load()} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
          Refresh
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05, duration: 0.35 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <StatCard label="Total Reservations" description="All table reservations" value={stats.total} />
        <StatCard label="Today" description="Scheduled for today" value={stats.today} accent="amber" />
        <StatCard label="Pending" description="Awaiting confirmation" value={stats.pending} />
        <StatCard label="Confirmed" description="Approved bookings" value={stats.confirmed} />
      </motion.div>

      {/* CMS Image + Text Manager */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.35 }}>
        <CmsImageManager />
      </motion.div>

      {/* Signature Dishes */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.35 }}>
        <SignatureDishesManager />
      </motion.div>

      {/* Seating Sections */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.35 }}>
        <SeatingSectionsManager />
      </motion.div>

      {/* Reservations table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.35 }}
        className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
      >
        {/* Filter bar */}
        <div className="p-4 sm:p-5 border-b border-border space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium shrink-0">
              <SlidersHorizontal className="size-4 text-primary" />
              Filters &amp; sort
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg lg:hidden h-8" onClick={() => setShowFilters((v) => !v)}>
              <Filter className="size-4 mr-1" />
              {showFilters ? "Hide" : "Show"}
            </Button>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                key="filters"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap lg:flex-nowrap items-center gap-2">
                  <div className="relative w-full sm:w-40 lg:w-44 shrink-0">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <input
                      type="search"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Name or phone..."
                      className="w-full h-9 pl-8 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                    />
                  </div>

                  <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangePreset)}>
                    <SelectTrigger className={cn(selectTriggerClass, "lg:w-[7.75rem]")}>
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7d">Last 7 days</SelectItem>
                      <SelectItem value="30d">Last 30 days</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className={cn(selectTriggerClass, "lg:w-[8.5rem]")}>
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All statuses</SelectItem>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                    <SelectTrigger className={cn(selectTriggerClass, "lg:w-[10.5rem]")}>
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="newest">Newest first</SelectItem>
                      <SelectItem value="oldest">Oldest first</SelectItem>
                      <SelectItem value="visit">Visit soonest</SelectItem>
                      <SelectItem value="name">Name A–Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button variant="outline" size="sm" className="h-9 rounded-lg shrink-0 px-3" onClick={clearFilters}>
                      <X className="size-3.5 mr-1" />Clear
                    </Button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Count row */}
        <div className="px-4 sm:px-5 py-3 border-b border-border bg-muted/20 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground">{filtered.length}</span>{" "}
            reservation{filtered.length !== 1 ? "s" : ""}
          </span>
          {loading && (
            <span className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="size-3.5 animate-spin" /> Loading…
            </span>
          )}
        </div>

        {/* List */}
        {loading && rows.length === 0 ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center"
          >
            <UtensilsCrossed className="size-12 mx-auto text-muted-foreground/40" />
            <h3 className="font-display text-xl mt-4">No reservations match</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
              Try widening the date range or clearing filters.
            </p>
            {hasActiveFilters && (
              <Button className="mt-6 rounded-xl" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
          </motion.div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-border">
              <motion.div variants={listVariants} initial="hidden" animate="show">
                <AnimatePresence mode="popLayout">
                  {filtered.map((row) => (
                    <ReservationCard
                      key={row.id}
                      row={row}
                      mapped={mappedById.get(row.id)!}
                      selected={selected?.id === row.id}
                      onSelect={() => openDetail(row)}
                    />
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                    <th className="px-4 py-3 font-medium">Guest</th>
                    <th className="px-4 py-3 font-medium">Visit</th>
                    <th className="px-4 py-3 font-medium text-center">Guests</th>
                    <th className="px-4 py-3 font-medium">Table</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Booked</th>
                    <th className="px-4 py-3 font-medium w-12" />
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence mode="popLayout">
                    {filtered.map((row) => (
                      <ReservationRow
                        key={row.id}
                        row={row}
                        mapped={mappedById.get(row.id)!}
                        selected={selected?.id === row.id}
                        onSelect={() => openDetail(row)}
                        onDelete={(e) => { e.stopPropagation(); void handleDelete(row.id); }}
                      />
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </motion.div>

      {/* Detail sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="p-6 pb-4 border-b border-border text-left">
            <SheetTitle className="font-display text-xl">
              {selected ? getGuestName(selected) : "Reservation"}
            </SheetTitle>
            <SheetDescription>Table reservation details</SheetDescription>
          </SheetHeader>

          <div className="p-6 flex-1">
            <AnimatePresence mode="wait">
              {selected && selectedReservation && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  <ReservationDetailPanel
                    reservation={selectedReservation}
                    allTables={RESTAURANT_TABLES}
                    onApprove={() => void handleStatusChange("confirmed")}
                    onDelete={() => void handleDelete(selected.id)}
                    isUpdating={updating}
                  />

                  <div className="rounded-xl border border-border p-4 space-y-3">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">
                      Update status
                    </p>
                    <Select
                      value={selected.status}
                      onValueChange={(v) => void handleStatusChange(v)}
                      disabled={updating}
                    >
                      <SelectTrigger className="rounded-xl h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button asChild variant="outline" className="w-full rounded-xl">
                    <Link to="/admin/reservations">Open floor plan</Link>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}