import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Globe,
  LayoutGrid,
  List,
  MapPin,
  Minus,
  Plus,
  Users,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDayStats,
  getReservationsForDate,
  getSlotAvailability,
  getTablesWithStatus,
  TIME_SLOTS,
} from "@/lib/reservations/availability";
import { RESTAURANT_TABLES, VENUE_NAME, ZONE_LABELS } from "@/lib/reservations/tables";
import { formatTimeSlot } from "@/lib/reservations/time-slots";
import type { Reservation, ZoneFilter } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

import { ReservationDetailPanel } from "./reservation-detail-panel";
import { TableCard } from "./table-card";

const ZONES: ZoneFilter[] = ["all", "garden", "indoor", "terrace"];

const LEGEND = [
  { key: "available", label: "Available", className: "bg-card border-border" },
  { key: "reserved", label: "Reserved", className: "bg-primary/10 border-primary/40" },
  { key: "unavailable", label: "Unavailable", className: "bg-muted/60 border-border opacity-60" },
  { key: "premium", label: "Premium", className: "bg-gold/15 border-gold/40" },
] as const;

const DEFAULT_DATE = "2026-05-15";
const DEFAULT_TIME = "19:00";

export function ReservationsPage() {
  const [date, setDate] = useState(DEFAULT_DATE);
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [zone, setZone] = useState<ZoneFilter>("all");
  const [view, setView] = useState<"floor" | "list">("floor");
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

  const tables = useMemo(
    () => getTablesWithStatus(date, time, guests, zone),
    [date, time, guests, zone],
  );

  const dayReservations = useMemo(() => getReservationsForDate(date), [date]);
  const stats = useMemo(() => getDayStats(date), [date]);

  const selectedReservation = useMemo(() => {
    if (selectedReservationId) {
      return dayReservations.find((r) => r.id === selectedReservationId) ?? null;
    }
    const table = tables.find((t) => t.id === selectedTableId);
    return table?.reservation ?? null;
  }, [selectedReservationId, selectedTableId, dayReservations, tables]);

  const selectedTable = tables.find((t) => t.id === selectedTableId) ?? null;

  const shiftDate = (days: number) => {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
    setSelectedReservationId(null);
    setSelectedTableId(null);
  };

  const handleTableSelect = (tableId: string, reservation?: Reservation) => {
    setSelectedTableId(tableId);
    setSelectedReservationId(reservation?.id ?? null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1.5">
            <MapPin className="size-3.5" /> {VENUE_NAME}
          </p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Reservations</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            When are they joining? Track website bookings, tables, and guest details.
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "floor" | "list")}>
          <TabsList className="rounded-xl h-10">
            <TabsTrigger value="floor" className="rounded-lg gap-1.5">
              <LayoutGrid className="size-4" /> Floor plan
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg gap-1.5">
              <List className="size-4" /> All reservations
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </motion.div>

      {/* KPIs */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        <Kpi label="Covers today" value={String(stats.covers)} icon={Users} />
        <Kpi label="Confirmed" value={String(stats.confirmed)} accent />
        <Kpi label="Pending" value={String(stats.pending)} />
        <Kpi label="From website" value={String(stats.website)} icon={Globe} />
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_320px] gap-5">
        {/* Left controls */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4 xl:sticky xl:top-24 xl:self-start"
        >
          <div className="rounded-2xl border border-border bg-card p-5 shadow-soft space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                When are you joining us?
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={() => shiftDate(-1)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <div className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-muted/50 border border-border text-sm font-medium">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => {
                      setDate(e.target.value);
                      setSelectedReservationId(null);
                      setSelectedTableId(null);
                    }}
                    className="bg-transparent border-0 focus:outline-none w-[7.5rem]"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-xl shrink-0"
                  onClick={() => shiftDate(1)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Guests</p>
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  onClick={() => setGuests((g) => Math.max(1, g - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="text-sm font-medium">{guests} guests</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg"
                  onClick={() => setGuests((g) => Math.min(12, g + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Legend</p>
              <div className="grid grid-cols-2 gap-2">
                {LEGEND.map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className={cn("size-3 rounded-md border shrink-0", item.className)} />
                    {item.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Center */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4 min-w-0"
        >
          <AnimatePresence mode="wait">
            {view === "floor" ? (
              <motion.div
                key="floor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Time slots */}
                <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Time</p>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map((slot) => {
                      const { free, total } = getSlotAvailability(date, slot, guests);
                      const active = time === slot;
                      const full = free === 0;
                      return (
                        <motion.button
                          key={slot}
                          type="button"
                          onClick={() => {
                            setTime(slot);
                            setSelectedReservationId(null);
                            setSelectedTableId(null);
                          }}
                          whileTap={{ scale: 0.97 }}
                          className={cn(
                            "relative px-3 py-2 rounded-xl text-sm font-medium border transition-colors",
                            active
                              ? "bg-gradient-amber text-primary-foreground border-transparent shadow-glow"
                              : full
                                ? "bg-muted/40 text-muted-foreground border-border"
                                : "bg-card border-border hover:border-primary/40",
                          )}
                        >
                          {formatTimeSlot(slot)}
                          <span
                            className={cn(
                              "ml-1.5 text-[10px] opacity-80",
                              active && "text-primary-foreground/80",
                            )}
                          >
                            {free}/{total}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Zone filter */}
                <div className="flex flex-wrap gap-2">
                  {ZONES.map((z) => (
                    <Button
                      key={z}
                      variant={zone === z ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-xl",
                        zone === z && "bg-gradient-amber border-0 text-primary-foreground shadow-glow",
                      )}
                      onClick={() => setZone(z)}
                    >
                      {ZONE_LABELS[z]}
                    </Button>
                  ))}
                </div>

                {/* Table grid */}
                <div>
                  <p className="text-sm font-medium mb-3">Choose your table</p>
                  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <AnimatePresence mode="popLayout">
                      {tables.map((table, i) => (
                        <TableCard
                          key={table.id}
                          table={table}
                          index={i}
                          selected={selectedTableId === table.id}
                          onSelect={() => handleTableSelect(table.id, table.reservation)}
                        />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
              >
                <div className="p-4 border-b border-border">
                  <h3 className="font-display text-lg">All reservations · {date}</h3>
                  <p className="text-sm text-muted-foreground">Bookings from website and admin</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                        <th className="px-4 py-3 text-left font-medium">Time</th>
                        <th className="px-4 py-3 text-left font-medium">Table</th>
                        <th className="px-4 py-3 text-left font-medium">Guest</th>
                        <th className="px-4 py-3 text-left font-medium">Guests</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                        <th className="px-4 py-3 text-left font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dayReservations.map((r, i) => {
                        const tableName =
                          RESTAURANT_TABLES.find((t) => t.id === r.tableId)?.name ?? r.tableId;
                        return (
                          <motion.tr
                            key={r.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            onClick={() => {
                              setSelectedReservationId(r.id);
                              setSelectedTableId(r.tableId);
                              setTime(r.time);
                            }}
                            className={cn(
                              "border-b border-border/80 cursor-pointer transition-colors hover:bg-muted/40",
                              selectedReservationId === r.id && "bg-primary/5",
                              r.status === "cancelled" && "opacity-50",
                            )}
                          >
                            <td className="px-4 py-3">{formatTimeSlot(r.time)}</td>
                            <td className="px-4 py-3 font-medium">{tableName}</td>
                            <td className="px-4 py-3">{r.guestName}</td>
                            <td className="px-4 py-3">{r.guests}</td>
                            <td className="px-4 py-3 capitalize">{r.status}</td>
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="rounded-full font-normal">
                                {r.source === "website" && <Globe className="size-3 mr-1" />}
                                {r.source}
                              </Badge>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right panel */}
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:sticky xl:top-24 xl:self-start min-h-[420px]"
        >
          <ReservationDetailPanel
            reservation={selectedReservation}
            table={selectedTable}
            date={date}
            time={time}
            guests={guests}
          />
        </motion.div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  icon: Icon,
}: {
  label: string;
  value: string;
  accent?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={cn(
        "rounded-2xl border border-border p-4 shadow-soft",
        accent ? "bg-gradient-to-br from-primary/8 to-card" : "bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <p className="font-display text-2xl mt-1">{value}</p>
    </motion.div>
  );
}
