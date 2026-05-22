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
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type EventForm = {
  id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  created_at: string;
};

type PageClick = {
  id: string;
  cta: string;
  created_at: string;
};

export default function EventsAdminPage() {
  const [forms, setForms] = useState<EventForm[]>([]);
  const [clicks, setClicks] = useState<PageClick[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<EventForm | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadForms();
    loadClicks();
  }, []);

  const loadForms = async () => {
    try {
      const { data, error } = await supabase
        .from("events_event_forms")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) { console.error(error); return; }
      setForms(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadClicks = async () => {
    try {
      const { data, error } = await supabase
        .from("events_page_clicks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) { console.error(error); return; }
      setClicks(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this enquiry?")) return;
    try {
      const { error } = await supabase
        .from("events_event_forms")
        .delete()
        .eq("id", id);

      if (error) { alert("Failed to delete"); return; }
      setForms((prev) => prev.filter((f) => f.id !== id));
      if (viewing?.id === id) setViewing(null);
      setMessage("Enquiry deleted");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
    }
  };

  const ctaSummary = clicks.reduce((acc, c) => {
    acc[c.cta] = (acc[c.cta] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Events Management</h1>
        <p className="text-muted-foreground mt-2">
          View event enquiries and track page interactions from the Shivers Events page.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { label: "Total Enquiries", value: forms.length, icon: MessageSquare },
          { label: "Page Clicks", value: clicks.length, icon: BarChart3 },
          { label: "This Month", value: forms.filter((f) => new Date(f.created_at).getMonth() === new Date().getMonth()).length, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-3xl border bg-background p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <h2 className="text-3xl font-semibold mt-2">{value}</h2>
              </div>
              <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="size-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA ANALYTICS */}
      <div className="rounded-3xl border bg-background p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">CTA Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">Button clicks tracked on the Events page.</p>
        </div>
        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-4 font-medium">CTA Button</th>
                <th className="text-left px-4 py-4 font-medium">Total Clicks</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ctaSummary).length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-6 text-center text-muted-foreground">No clicks recorded yet.</td>
                </tr>
              ) : (
                Object.entries(ctaSummary)
                  .sort((a, b) => b[1] - a[1])
                  .map(([cta, count]) => (
                    <tr key={cta} className="border-t">
                      <td className="px-4 py-4">{cta}</td>
                      <td className="px-4 py-4 font-semibold">{count}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ENQUIRIES */}
      <div className="rounded-3xl border bg-background p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Event Enquiries</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Submitted via the "Plan Your Event" form on the main site.
            </p>
          </div>
          {message && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="size-4" /> {message}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading enquiries...
          </div>
        ) : forms.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No enquiries yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Name", "Email", "Phone", "Message", "Date", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forms.map((f) => (
                  <tr key={f.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4 font-medium">{f.name || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{f.email || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground">{f.phone || "—"}</td>
                    <td className="px-4 py-4 max-w-[200px] truncate text-muted-foreground">{f.message || "—"}</td>
                    <td className="px-4 py-4 text-muted-foreground whitespace-nowrap">
                      {new Date(f.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewing(f)}
                          className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Trash2 className="size-4 text-red-500" />
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

      {/* VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-lg rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Enquiry Details</h2>
              <button
                onClick={() => setViewing(null)}
                className="size-10 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Name</p>
                  <p className="font-medium">{viewing.name || "—"}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Date Submitted</p>
                  <p className="font-medium">{new Date(viewing.created_at).toLocaleString()}</p>
                </div>
              </div>

              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" /> Email</p>
                <p className="font-medium">{viewing.email || "—"}</p>
              </div>

              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Phone</p>
                <p className="font-medium">{viewing.phone || "—"}</p>
              </div>

              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><MessageSquare className="size-3" /> Message</p>
                <p className="text-sm leading-relaxed">{viewing.message || "—"}</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => handleDelete(viewing.id)}
                  className="h-11 px-5 rounded-2xl border inline-flex items-center gap-2 text-sm hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-4 text-red-500" /> Delete
                </button>
                <button
                  onClick={() => window.location.href = `mailto:${viewing.email}`}
                  className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium"
                >
                  <Mail className="size-4" /> Reply via Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}