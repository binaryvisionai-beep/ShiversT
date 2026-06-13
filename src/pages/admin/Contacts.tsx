import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

// ─── Types ──────────────────────────────────────────────────────────────────── 

type ContactInfo = {
  id: string;
  phone: string;
  email: string;
  address: string;
  gmaps_url: string;
  gmaps_embed: string;
};

type Enquiry = {
  id: string;
  name: string;
  email: string;
  phone: string;
  inquiry_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

const INQUIRY_TYPES = [
  "All",
  "Room Reservation",
  "Restaurant Table Reservation",
  "Events & Celebrations",
  "Tiffin Box",
  "General Inquiry",
];

const FIELD_LABEL: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  address: "Address",
  gmaps_url: "Google Maps Link",
  gmaps_embed: "Google Maps Embed URL",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminContacts() {
  const [info, setInfo] = useState<ContactInfo | null>(null);
  const [editInfo, setEditInfo] = useState<ContactInfo | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loadingEnquiries, setLoadingEnquiries] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [viewing, setViewing] = useState<Enquiry | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => { loadInfo(); loadEnquiries(); }, []);

  const loadInfo = async () => {
    const { data } = await supabase.from("contact_info").select("*").limit(1).single();
    if (data) { setInfo(data as ContactInfo); setEditInfo(data as ContactInfo); }
  };

  const loadEnquiries = async () => {
    setLoadingEnquiries(true);
    const { data } = await supabase
      .from("contact_enquiries")
      .select("*")
      .order("created_at", { ascending: false });
    setEnquiries((data as Enquiry[]) || []);
    setLoadingEnquiries(false);
  };

  const saveInfo = async () => {
    if (!editInfo) return;
    setSavingInfo(true);
    const { error } = await supabase
      .from("contact_info")
      .update({
        phone: editInfo.phone,
        email: editInfo.email,
        address: editInfo.address,
        gmaps_url: editInfo.gmaps_url,
        gmaps_embed: editInfo.gmaps_embed,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editInfo.id);
    setSavingInfo(false);
    if (!error) {
      setInfo({ ...editInfo });
      setInfoSaved(true);
      setTimeout(() => setInfoSaved(false), 3000);
    }
  };

  const markRead = async (id: string) => {
    await supabase.from("contact_enquiries").update({ is_read: true }).eq("id", id);
    setEnquiries((prev) => prev.map((e) => e.id === id ? { ...e, is_read: true } : e));
  };

  const deleteEnquiry = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    await supabase.from("contact_enquiries").delete().eq("id", id);
    setEnquiries((prev) => prev.filter((e) => e.id !== id));
    if (viewing?.id === id) setViewing(null);
    setMessage("Enquiry deleted");
    setTimeout(() => setMessage(""), 3000);
  };

  const filtered = activeCategory === "All"
    ? enquiries
    : enquiries.filter((e) => e.inquiry_type === activeCategory);

  const unreadCount = (cat: string) =>
    (cat === "All" ? enquiries : enquiries.filter((e) => e.inquiry_type === cat))
      .filter((e) => !e.is_read).length;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Contacts</h1>
          <p className="text-muted-foreground mt-1">
            Manage contact details and view enquiries from the main site.
          </p>
        </div>
        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      {/* ── Contact Info Editor ── */}
      <div className="rounded-3xl border bg-background p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Contact Information</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Shown on the public contact page.
            </p>
          </div>
          {infoSaved && (
            <span className="text-sm text-green-600 flex items-center gap-1.5">
              <CheckCircle2 className="size-4" /> Saved
            </span>
          )}
        </div>

        {editInfo ? (
          <div className="space-y-4">
            {(["phone", "email", "address", "gmaps_url", "gmaps_embed"] as const).map((field) => (
              <div key={field}>
                <label className="text-xs text-muted-foreground uppercase tracking-wider mb-1 block">
                  {FIELD_LABEL[field]}
                  {field === "gmaps_embed" && (
                    <span className="ml-2 normal-case text-muted-foreground/70">
                      (paste the src="" value from Google Maps embed iframe — enables satellite map)
                    </span>
                  )}
                </label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  value={(editInfo as any)[field]}
                  onChange={(e) => setEditInfo({ ...editInfo, [field]: e.target.value })}
                  placeholder={
                    field === "gmaps_embed"
                      ? "https://www.google.com/maps/embed?pb=..."
                      : undefined
                  }
                />
              </div>
            ))}

            <button
              onClick={saveInfo}
              disabled={savingInfo}
              className="h-10 px-5 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium disabled:opacity-50"
            >
              {savingInfo ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Changes
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading...
          </div>
        )}
      </div>

      {/* ── Enquiries ── */}
      <div className="rounded-3xl border bg-background p-6 space-y-5">
        <div>
          <h2 className="text-xl font-semibold">Enquiries</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Submissions from the Contact Us form — filtered by category.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2">
          {INQUIRY_TYPES.map((cat) => {
            const count = unreadCount(cat);
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  isActive
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {cat}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                    isActive ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {loadingEnquiries ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground text-sm">No enquiries in this category.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((enq) => (
              <div
                key={enq.id}
                className={`rounded-2xl border transition-colors ${
                  !enq.is_read ? "border-primary/30 bg-primary/5" : "border-border bg-background"
                }`}
              >
                {/* Row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{enq.name}</span>
                      {!enq.is_read && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                          New
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {enq.inquiry_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{enq.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden md:inline">
                    {new Date(enq.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setViewing(enq);
                        if (!enq.is_read) markRead(enq.id);
                      }}
                      className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                      title="View details"
                    >
                      <MessageSquare className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setExpanded(expanded === enq.id ? null : enq.id)}
                      className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      {expanded === enq.id
                        ? <ChevronUp className="size-3.5" />
                        : <ChevronDown className="size-3.5" />}
                    </button>
                    <button
                      onClick={() => deleteEnquiry(enq.id)}
                      className="size-8 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                    >
                      <Trash2 className="size-3.5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Inline expand */}
                {expanded === enq.id && (
                  <div className="border-t px-4 py-4 space-y-3 bg-muted/20">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Email</p>
                        <a href={`mailto:${enq.email}`} className="font-medium hover:underline">{enq.email}</a>
                      </div>
                      {enq.phone && (
                        <div>
                          <p className="text-xs text-muted-foreground">Phone</p>
                          <a href={`tel:${enq.phone}`} className="font-medium hover:underline">{enq.phone}</a>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-muted-foreground">Inquiry Type</p>
                        <p className="font-medium">{enq.inquiry_type}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Received</p>
                        <p className="font-medium">{new Date(enq.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Message</p>
                      <p className="text-sm leading-relaxed">{enq.message}</p>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={`mailto:${enq.email}`}
                        className="h-9 px-4 rounded-xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium"
                      >
                        <Mail className="size-3.5" /> Reply
                      </a>
                      {enq.phone && (
                        <a
                          href={`tel:${enq.phone}`}
                          className="h-9 px-4 rounded-xl border inline-flex items-center gap-2 text-sm hover:bg-muted transition-colors"
                        >
                          <Phone className="size-3.5" /> Call
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-lg rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Enquiry Details</h2>
              <button
                onClick={() => setViewing(null)}
                className="size-10 rounded-xl border flex items-center justify-center hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{viewing.name}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{new Date(viewing.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" /> Email</p>
                <p className="font-medium">{viewing.email}</p>
              </div>
              {viewing.phone && (
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Phone</p>
                  <p className="font-medium">{viewing.phone}</p>
                </div>
              )}
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Inquiry Type</p>
                <p className="font-medium">{viewing.inquiry_type}</p>
              </div>
              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="size-3" /> Message</p>
                <p className="text-sm leading-relaxed">{viewing.message}</p>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => deleteEnquiry(viewing.id)}
                  className="h-11 px-5 rounded-2xl border inline-flex items-center gap-2 text-sm hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-4 text-red-500" /> Delete
                </button>
                <a
                  href={`mailto:${viewing.email}`}
                  className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="size-4" /> Reply via Email
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
