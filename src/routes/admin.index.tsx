import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  BedDouble,
  Users,
  Star,
  CalendarCheck2,
  Clock,
  Sparkles,
  MoreHorizontal,
  UtensilsCrossed,
  PartyPopper,
  MessageSquare,
  Briefcase,
  RefreshCw,
} from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow, format, subDays, startOfDay } from "date-fns";

export const Route = createFileRoute("/admin/")({
  component: DashboardPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type RecentBooking = {
  id: string;
  guest: string;
  room: string;
  checkin: string;
  status: string;
  type: "room" | "restaurant" | "event";
};

type ActivityItem = {
  id: string;
  text: string;
  strong: string;
  sub: string;
  time: string;
};

type DashStats = {
  roomBookings: number;
  restaurantReservations: number;
  eventEnquiries: number;
  careerApplications: number;
  newMessages: number;
  pendingRoomBookings: number;
  pendingRestaurantRes: number;
};

type DailyCount = { d: string; v: number };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getDayLabel(dateStr: string) {
  return format(new Date(dateStr), "EEE");
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { session } = useAuth();
  const displayName = session?.name ?? "Guest";

  const [stats, setStats] = useState<DashStats>({
    roomBookings: 0,
    restaurantReservations: 0,
    eventEnquiries: 0,
    careerApplications: 0,
    newMessages: 0,
    pendingRoomBookings: 0,
    pendingRestaurantRes: 0,
  });

  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [weeklyData, setWeeklyData] = useState<DailyCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const load = async () => {
    setRefreshing(true);
    try {
      // ── Parallel fetches ──────────────────────────────────────────────────
      const [
        { count: roomCount },
        { count: restaurantCount },
        { count: eventCount },
        { count: careerCount },
        { count: messageCount },
        { count: pendingRooms },
        { count: pendingRest },
        { data: recentRooms },
        { data: recentRest },
        { data: recentEvents },
        { data: recentCareers },
      ] = await Promise.all([
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("restaurant_reservations").select("*", { count: "exact", head: true }),
        supabase.from("events_event_forms").select("*", { count: "exact", head: true }),
        supabase.from("careers_applications").select("*", { count: "exact", head: true }),
        supabase.from("contact_messages").select("*", { count: "exact", head: true }).eq("read", false),
        supabase.from("bookings").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("restaurant_reservations").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("bookings").select("id,guest_name,room_type,check_in,status").order("created_at", { ascending: false }).limit(3),
        supabase.from("restaurant_reservations").select("id,guest_name,customer_name,reservation_date,reservation_time,status").order("created_at", { ascending: false }).limit(3),
        supabase.from("events_event_forms").select("id,name,event_name,created_at").order("created_at", { ascending: false }).limit(2),
        supabase.from("careers_applications").select("id,full_name,created_at").order("created_at", { ascending: false }).limit(2),
      ]);

      setStats({
        roomBookings:           roomCount       ?? 0,
        restaurantReservations: restaurantCount ?? 0,
        eventEnquiries:         eventCount      ?? 0,
        careerApplications:     careerCount     ?? 0,
        newMessages:            messageCount    ?? 0,
        pendingRoomBookings:    pendingRooms    ?? 0,
        pendingRestaurantRes:   pendingRest     ?? 0,
      });

      // ── Recent bookings merged ─────────────────────────────────────────
      const merged: RecentBooking[] = [
        ...(recentRooms ?? []).map((r: any) => ({
          id: r.id,
          guest: r.guest_name ?? "Guest",
          room: r.room_type ?? "Room",
          checkin: r.check_in ? format(new Date(r.check_in), "d MMM") : "—",
          status: r.status ?? "pending",
          type: "room" as const,
        })),
        ...(recentRest ?? []).map((r: any) => ({
          id: r.id,
          guest: r.guest_name || r.customer_name || "Guest",
          room: `Table — ${r.reservation_date ? format(new Date(r.reservation_date), "d MMM") : ""}`,
          checkin: r.reservation_time ?? "—",
          status: r.status ?? "pending",
          type: "restaurant" as const,
        })),
      ].slice(0, 5);
      setRecentBookings(merged);

      // ── Activity feed ──────────────────────────────────────────────────
      const acts: ActivityItem[] = [
        ...(recentRooms ?? []).slice(0, 2).map((r: any) => ({
          id: `room-${r.id}`,
          text: "Room booking from ",
          strong: r.guest_name ?? "Guest",
          sub: `${r.room_type ?? "Room"} · Check-in ${r.check_in ? format(new Date(r.check_in), "d MMM") : ""}`,
          time: r.created_at,
        })),
        ...(recentRest ?? []).slice(0, 2).map((r: any) => ({
          id: `res-${r.id}`,
          text: "Table reservation from ",
          strong: r.guest_name || r.customer_name || "Guest",
          sub: `${r.reservation_date ? format(new Date(r.reservation_date), "d MMM") : ""} · ${r.reservation_time ?? ""}`,
          time: r.created_at,
        })),
        ...(recentEvents ?? []).map((r: any) => ({
          id: `ev-${r.id}`,
          text: "Event enquiry from ",
          strong: r.name ?? "Guest",
          sub: r.event_name ? `For: ${r.event_name}` : "General enquiry",
          time: r.created_at,
        })),
        ...(recentCareers ?? []).map((r: any) => ({
          id: `ca-${r.id}`,
          text: "Career application from ",
          strong: r.full_name ?? "Applicant",
          sub: "Applied to join the team",
          time: r.created_at,
        })),
      ]
        .filter((a) => a.time)
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 6);
      setActivity(acts);

      // ── Weekly reservations chart (last 7 days) ────────────────────────
      const days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return { date: startOfDay(d), label: format(d, "EEE") };
      });

      const since = days[0].date.toISOString();
      const { data: weekRooms } = await supabase
        .from("bookings")
        .select("created_at")
        .gte("created_at", since);
      const { data: weekRest } = await supabase
        .from("restaurant_reservations")
        .select("created_at")
        .gte("created_at", since);

      const countByDay: Record<string, number> = {};
      [...(weekRooms ?? []), ...(weekRest ?? [])].forEach((r: any) => {
        const label = getDayLabel(r.created_at);
        countByDay[label] = (countByDay[label] ?? 0) + 1;
      });

      setWeeklyData(days.map(({ label }) => ({ d: label, v: countByDay[label] ?? 0 })));
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const todayStr = format(new Date(), "EEEE · d MMMM yyyy");

  return (
    <div className="space-y-4 sm:space-y-6 min-w-0 max-w-full overflow-x-hidden">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between min-w-0">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{todayStr}</p>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl mt-1 break-words leading-tight">
            Welcome back,{" "}
            <span className="text-gradient-amber break-words">{displayName}</span>
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Here's what's happening across Shivers today.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
          <Button
            variant="outline"
            className="rounded-xl h-11 w-full sm:w-auto gap-2"
            onClick={() => void load()}
            disabled={refreshing}
          >
            <RefreshCw className={`size-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button className="rounded-xl h-11 w-full sm:w-auto bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95">
            <Sparkles className="size-4 shrink-0" /> New Booking
          </Button>
        </div>
      </div>

      {/* Last updated */}
      {!loading && (
        <p className="text-xs text-muted-foreground">
          Last updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
        </p>
      )}

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 min-w-0">
        <KPICard
          label="Room Bookings"
          value={loading ? "—" : String(stats.roomBookings)}
          sub={loading ? "" : `${stats.pendingRoomBookings} pending`}
          icon={BedDouble}
          accent
        />
        <KPICard
          label="Table Reservations"
          value={loading ? "—" : String(stats.restaurantReservations)}
          sub={loading ? "" : `${stats.pendingRestaurantRes} pending`}
          icon={UtensilsCrossed}
        />
        <KPICard
          label="Event Enquiries"
          value={loading ? "—" : String(stats.eventEnquiries)}
          sub="Total submitted"
          icon={PartyPopper}
        />
        <KPICard
          label="Applications"
          value={loading ? "—" : String(stats.careerApplications)}
          sub="Career submissions"
          icon={Briefcase}
        />
      </div>

      {/* ── Charts row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">

        {/* Weekly activity bar chart */}
        <Card className="lg:col-span-2 min-w-0">
          <CardHeader title="Weekly Bookings" sub="Combined room + restaurant reservations (last 7 days)" />
          {loading ? (
            <div className="h-52 flex items-center justify-center text-sm text-muted-foreground">
              Loading chart...
            </div>
          ) : (
            <div className="h-52 sm:h-64 min-w-0 w-full overflow-hidden">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} strokeDasharray="3 6" />
                  <XAxis
                    dataKey="d"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <RTooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-xl border border-border bg-popover shadow-lift p-3 text-xs">
                          <div className="font-medium mb-1">{label}</div>
                          <div className="text-muted-foreground">
                            {payload[0]?.value} booking{payload[0]?.value === 1 ? "" : "s"}
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="v" radius={[8, 8, 8, 8]} fill="var(--primary)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        {/* Quick stats panel */}
        <Card className="min-w-0 flex flex-col gap-4">
          <CardHeader title="At a Glance" sub="Today's pending actions" />
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-3">
              <QuickStat icon={BedDouble}       label="Pending Room Bookings"      value={stats.pendingRoomBookings}    href="/admin/room-bookings" />
              <QuickStat icon={UtensilsCrossed} label="Pending Restaurant Res."    value={stats.pendingRestaurantRes}   href="/admin/restaurant"   />
              <QuickStat icon={PartyPopper}     label="Event Enquiries"            value={stats.eventEnquiries}         href="/admin/events"       />
              <QuickStat icon={Briefcase}       label="Career Applications"        value={stats.careerApplications}     href="/admin/careers"      />
              <QuickStat icon={MessageSquare}   label="Unread Messages"            value={stats.newMessages}            href="/admin/messages"     />
            </div>
          )}
        </Card>
      </div>

      {/* ── Recent Bookings + Activity ────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 min-w-0">

        {/* Recent bookings */}
        <Card className="lg:col-span-2 p-0 overflow-hidden min-w-0">
          <div className="p-4 sm:p-6 pb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0">
            <div className="min-w-0">
              <h3 className="font-display text-lg">Recent Bookings</h3>
              <p className="text-sm text-muted-foreground">Latest room + restaurant entries</p>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg shrink-0 self-start sm:self-auto" asChild>
              <a href="/admin/bookings">View all <ArrowUpRight className="size-4" /></a>
            </Button>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Loading...</div>
          ) : recentBookings.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No bookings yet.</div>
          ) : (
            <>
              {/* Mobile */}
              <div className="md:hidden divide-y divide-border border-t border-border">
                {recentBookings.map((b) => (
                  <div key={b.id} className="p-4 flex gap-3 min-w-0">
                    <div className="size-10 shrink-0 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee">
                      {getInitials(b.guest)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium truncate">{b.guest}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">{b.room}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="size-3 shrink-0" /> {b.checkin}
                        {b.type === "restaurant" && " · Restaurant"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm min-w-[560px]">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/40">
                      <Th>Guest</Th>
                      <Th>Details</Th>
                      <Th>When</Th>
                      <Th>Type</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((b) => (
                      <tr key={b.id} className="border-t border-border hover:bg-accent/40 transition-colors">
                        <Td>
                          <div className="flex items-center gap-3">
                            <div className="size-9 shrink-0 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee">
                              {getInitials(b.guest)}
                            </div>
                            <span className="font-medium truncate max-w-[120px]">{b.guest}</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="truncate max-w-[140px] block text-muted-foreground">{b.room}</span>
                        </Td>
                        <Td>
                          <span className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="size-3.5 shrink-0" /> {b.checkin}
                          </span>
                        </Td>
                        <Td>
                          <span className="capitalize text-xs text-muted-foreground">
                            {b.type === "room" ? "Room" : "Restaurant"}
                          </span>
                        </Td>
                        <Td><StatusBadge status={b.status} /></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>

        {/* Activity feed */}
        <Card className="min-w-0">
          <CardHeader title="Activity" sub="Across all services">
            <button className="text-muted-foreground hover:text-foreground" onClick={() => void load()}>
              <MoreHorizontal className="size-4" />
            </button>
          </CardHeader>
          {loading ? (
            <div className="text-sm text-muted-foreground text-center py-6">Loading...</div>
          ) : activity.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">No activity yet.</div>
          ) : (
            <ol className="relative space-y-5 pl-5 before:content-[''] before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-border">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[18px] top-1.5 size-2.5 rounded-full bg-primary ring-4 ring-background" />
                  <div className="text-sm leading-snug">
                    <span className="text-muted-foreground">{a.text}</span>
                    <span className="font-medium">{a.strong}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{a.sub}</div>
                  <div className="text-[11px] text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(a.time), { addSuffix: true })}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────────── */

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`bg-card rounded-2xl border border-border shadow-soft hover:shadow-lift transition-shadow p-4 sm:p-6 min-w-0 max-w-full ${className}`}
    >
      {children}
    </motion.div>
  );
}

function CardHeader({
  title, sub, children,
}: {
  title: string; sub?: string; children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3 min-w-0">
      <div className="min-w-0">
        <h3 className="font-display text-lg">{title}</h3>
        {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
}

function KPICard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`relative overflow-hidden rounded-2xl border border-border p-4 sm:p-5 shadow-soft hover:shadow-lift transition-shadow min-w-0 max-w-full ${
        accent ? "bg-gradient-to-br from-primary/8 to-card" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="font-display text-2xl sm:text-3xl mt-1.5 truncate">{value}</div>
          {sub && <div className="text-xs text-muted-foreground mt-1">{sub}</div>}
        </div>
        <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
          accent ? "bg-gradient-amber text-primary-foreground shadow-glow" : "bg-muted text-foreground"
        }`}>
          <Icon className="size-[18px]" />
        </div>
      </div>
    </motion.div>
  );
}

function QuickStat({
  icon: Icon, label, value, href,
}: {
  icon: React.ComponentType<{ className?: string }>; label: string; value: number; href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 hover:bg-muted/40 transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <Icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </span>
        <span className="text-sm text-muted-foreground truncate">{label}</span>
      </div>
      <span className="font-display text-lg shrink-0">{value}</span>
    </a>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 lg:px-5 py-3 font-medium whitespace-nowrap ${className}`}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 lg:px-5 py-3 ${className}`}>{children}</td>;
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const map: Record<string, string> = {
    confirmed: "bg-primary/10 text-primary border-primary/20",
    pending:   "bg-gold/15 text-bronze border-gold/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    completed: "bg-muted text-muted-foreground border-border",
    new:       "bg-blue-100 text-blue-700 border-blue-200",
  };
  return (
    <Badge variant="outline" className={`rounded-full font-normal capitalize ${map[s] ?? ""}`}>
      <span className="size-1.5 rounded-full bg-current mr-1.5" />
      {s}
    </Badge>
  );
}

// silence unused
void Star; void Users; void CalendarCheck2;