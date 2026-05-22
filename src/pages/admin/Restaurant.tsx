import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Eye,
  BarChart3,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  MapPin,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Reservation = {
  id: string;
  reservation_date: string;
  reservation_time: string;
  guests: number;
  table_id: string;
  table_label: string;
  table_zone: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  special_requests: string;
  status: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  reference_code: string;
  table_seats: number;
  is_premium_table: boolean;
  source: string;
  created_at: string;
  updated_at: string;
};

const STATUS_OPTIONS = ["confirmed", "pending", "cancelled", "completed"];

const statusColor = (status: string) => {
  switch (status) {
    case "confirmed": return "bg-green-100 text-green-700";
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "cancelled": return "bg-red-100 text-red-700";
    case "completed": return "bg-blue-100 text-blue-700";
    default: return "bg-muted text-muted-foreground";
  }
};

export default function RestaurantAdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewing, setViewing] = useState<Reservation | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      const { data, error } = await supabase
        .from("restaurant_reservations")
        .select("*")
        .order("reservation_date", { ascending: false });

      if (error) { console.error(error); return; }
      setReservations(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from("restaurant_reservations")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id);

      if (error) { console.error(error); return; }

      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );

      if (viewing?.id === id) setViewing((prev) => prev ? { ...prev, status } : prev);

      setMessage("Status updated");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this reservation?")) return;
    try {
      const { error } = await supabase
        .from("restaurant_reservations")
        .delete()
        .eq("id", id);

      if (error) { alert("Failed to delete"); return; }
      setReservations((prev) => prev.filter((r) => r.id !== id));
      if (viewing?.id === id) setViewing(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = reservations.filter((r) => {
    const matchStatus = filterStatus === "all" || r.status === filterStatus;
    const matchDate = !filterDate || r.reservation_date === filterDate;
    return matchStatus && matchDate;
  });

  const totalToday = reservations.filter(
    (r) => r.reservation_date === new Date().toISOString().split("T")[0]
  ).length;

  const totalConfirmed = reservations.filter((r) => r.status === "confirmed").length;
  const totalPending = reservations.filter((r) => r.status === "pending").length;

  const getName = (r: Reservation) => r.guest_name || r.customer_name || "—";
  const getPhone = (r: Reservation) => r.guest_phone || r.customer_phone || "—";
  const getEmail = (r: Reservation) => r.guest_email || r.customer_email || "—";

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-semibold">Restaurant Management</h1>
        <p className="text-muted-foreground mt-2">
          View and manage all table reservations from the Shivers Restaurant page.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          { label: "Total Reservations", value: reservations.length, icon: Calendar },
          { label: "Today's Bookings", value: totalToday, icon: Clock },
          { label: "Confirmed", value: totalConfirmed, icon: CheckCircle2 },
          { label: "Pending", value: totalPending, icon: Eye },
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

      {/* FILTERS */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 pl-4 pr-10 rounded-2xl border bg-background appearance-none text-sm"
          >
            <option value="all">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          className="h-11 px-4 rounded-2xl border bg-background text-sm"
        />

        {(filterStatus !== "all" || filterDate) && (
          <button
            onClick={() => { setFilterStatus("all"); setFilterDate(""); }}
            className="h-11 px-4 rounded-2xl border text-sm inline-flex items-center gap-2"
          >
            <X className="size-4" /> Clear
          </button>
        )}

        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600 ml-auto">
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      {/* TABLE */}
      <div className="rounded-3xl border bg-background p-6 space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Reservations</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {filtered.length} reservation{filtered.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading reservations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center">
            <p className="text-muted-foreground">No reservations found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  {["Guest", "Date & Time", "Guests", "Table", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-4 py-4 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} className="border-t hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4">
                      <p className="font-medium">{getName(r)}</p>
                      <p className="text-xs text-muted-foreground">{getPhone(r)}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p>{r.reservation_date}</p>
                      <p className="text-xs text-muted-foreground">{r.reservation_time}</p>
                    </td>
                    <td className="px-4 py-4">{r.guests}</td>
                    <td className="px-4 py-4">
                      <p>{r.table_label || r.table_id || "—"}</p>
                      <p className="text-xs text-muted-foreground">{r.table_zone || ""}</p>
                    </td>
                    <td className="px-4 py-4">
                      <div className="relative">
                        <select
                          value={r.status || "pending"}
                          onChange={(e) => handleStatusChange(r.id, e.target.value)}
                          disabled={updatingId === r.id}
                          className={`pl-3 pr-8 py-1.5 rounded-full text-xs font-medium appearance-none border-0 cursor-pointer ${statusColor(r.status)}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        {updatingId === r.id && (
                          <Loader2 className="size-3 animate-spin absolute right-2 top-1/2 -translate-y-1/2" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewing(r)}
                          className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(r.id)}
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
          <div className="w-full max-w-2xl rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reservation Details</h2>
              <button
                onClick={() => setViewing(null)}
                className="size-10 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {viewing.reference_code && (
                <div className="rounded-2xl bg-muted/30 p-4 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Reference Code</span>
                  <span className="font-mono font-semibold">{viewing.reference_code}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Guest Name</p>
                  <p className="font-medium">{getName(viewing)}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Status</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColor(viewing.status)}`}>
                    {viewing.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="size-3" /> Phone</p>
                  <p className="font-medium">{getPhone(viewing)}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="size-3" /> Email</p>
                  <p className="font-medium text-sm">{getEmail(viewing)}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="size-3" /> Date</p>
                  <p className="font-medium">{viewing.reservation_date}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> Time</p>
                  <p className="font-medium">{viewing.reservation_time}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Users className="size-3" /> Guests</p>
                  <p className="font-medium">{viewing.guests}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="size-3" /> Table</p>
                  <p className="font-medium">{viewing.table_label || viewing.table_id || "—"}</p>
                  <p className="text-xs text-muted-foreground">{viewing.table_zone || ""}</p>
                </div>
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Source</p>
                  <p className="font-medium capitalize">{viewing.source || "website"}</p>
                </div>
              </div>

              {viewing.special_requests && (
                <div className="rounded-2xl border p-4 space-y-1">
                  <p className="text-xs text-muted-foreground">Special Requests</p>
                  <p className="text-sm leading-relaxed">{viewing.special_requests}</p>
                </div>
              )}

              <div className="rounded-2xl border p-4 space-y-1">
                <p className="text-xs text-muted-foreground">Update Status</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleStatusChange(viewing.id, s)}
                      disabled={viewing.status === s || updatingId === viewing.id}
                      className={`px-4 py-2 rounded-full text-xs font-medium transition-all disabled:opacity-50 ${
                        viewing.status === s ? statusColor(s) : "border hover:bg-muted"
                      }`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-right">
                Created: {new Date(viewing.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}