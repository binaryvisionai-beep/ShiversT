import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Clock, Globe, LayoutGrid, List, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useReservations } from "@/hooks/use-reservations";
import { useUpdateReservationStatus } from "@/hooks/use-update-reservation-status";
import {
  getDayStats,
  getRecentReservations,
  getReservationById,
  getReservationsForDate,
  getSlotAvailability,
  getTablesWithStatus,
} from "@/lib/reservations/availability";
import { RESTAURANT_TABLES, VENUE_NAME, ZONE_LABELS } from "@/lib/reservations/tables";
import {
  buildEffectiveTimeSlots,
  formatTimeSlot,
  isDefaultTimeSlot,
} from "@/lib/reservations/time-slots";
import type { Reservation, RestaurantTable, ZoneFilter } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

import { AddTableDialog } from "./AddTableDialog";
import { ManageTimeSlotsDialog } from "./ManageTimeSlotsDialog";
import { ReservationDetailPanel } from "./reservation-detail-panel";
import { TableCard } from "./table-card";

const ZONES: ZoneFilter[] = ["all", "garden", "indoor", "terrace"];

const DEFAULT_DATE = format(new Date(), "yyyy-MM-dd");
const DEFAULT_TIME = "19:00";

function reservationTableName(
  r: Reservation,
  allTables: RestaurantTable[],
): string {
  return (
    allTables.find((t) => t.id.toLowerCase() === r.tableId.toLowerCase())?.name ??
    r.tableLabel ??
    r.tableId
  );
}

type DeleteConfirm =
  | { mode: "single"; table: RestaurantTable }
  | { mode: "bulk"; zone: ZoneFilter; count: number }
  | { mode: "reservation"; reservation: Reservation }
  | { mode: "time"; slot: string }
  | { mode: "times-bulk"; count: number };

export function ReservationsPage() {
  const [date, setDate] = useState(DEFAULT_DATE);
  const [guests, setGuests] = useState(2);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [zone, setZone] = useState<ZoneFilter>("all");
  const [view, setView] = useState<"floor" | "list" | "recent">("floor");
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [customTables, setCustomTables] = useState<RestaurantTable[]>([]);
  const [removedTableIds, setRemovedTableIds] = useState<Set<string>>(() => new Set());
  const [addTableOpen, setAddTableOpen] = useState(false);
  const [manageTimeOpen, setManageTimeOpen] = useState(false);
  const [customTimeSlots, setCustomTimeSlots] = useState<string[]>([]);
  const [removedTimeSlots, setRemovedTimeSlots] = useState<Set<string>>(() => new Set());
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { reservations, isLoading, isError, refetch } = useReservations();
  const updateStatus = useUpdateReservationStatus();

  const allTables = useMemo(
    () => [...RESTAURANT_TABLES, ...customTables].filter((t) => !removedTableIds.has(t.id)),
    [customTables, removedTableIds],
  );

  const tablesInZoneScope = useMemo(
    () => allTables.filter((t) => zone === "all" || t.zone === zone),
    [allTables, zone],
  );

  const timeSlots = useMemo(
    () => buildEffectiveTimeSlots(customTimeSlots, removedTimeSlots),
    [customTimeSlots, removedTimeSlots],
  );

  useEffect(() => {
    if (timeSlots.length > 0 && !timeSlots.includes(time)) {
      setTime(timeSlots[0]);
    }
  }, [timeSlots, time]);

  const removeTimeSlots = useCallback((slots: string[]) => {
    if (slots.length === 0) return;
    setCustomTimeSlots((prev) => prev.filter((s) => !slots.includes(s)));
    setRemovedTimeSlots((prev) => {
      const next = new Set(prev);
      for (const slot of slots) {
        if (isDefaultTimeSlot(slot)) next.add(slot);
      }
      return next;
    });
  }, []);

  const removeTableIds = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      setCustomTables((prev) => prev.filter((t) => !ids.includes(t.id)));
      setRemovedTableIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.add(id));
        return next;
      });
      if (selectedTableId && ids.includes(selectedTableId)) {
        setSelectedTableId(null);
        setSelectedReservationId(null);
      }
    },
    [selectedTableId],
  );

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.mode === "single") {
      removeTableIds([deleteConfirm.table.id]);
      toast.success(`Table "${deleteConfirm.table.name}" removed`);
    } else if (deleteConfirm.mode === "reservation") {
      const { reservation } = deleteConfirm;
      updateStatus.mutate(
        { id: reservation.id, status: "cancelled" },
        {
          onSuccess: () => {
            setDetailOpen(false);
            setSelectedReservationId(null);
            setSelectedTableId(null);
          },
        },
      );
    } else if (deleteConfirm.mode === "time") {
      removeTimeSlots([deleteConfirm.slot]);
      toast.success(`Removed ${formatTimeSlot(deleteConfirm.slot)}`);
    } else if (deleteConfirm.mode === "times-bulk") {
      removeTimeSlots(timeSlots);
      toast.success(`Removed ${deleteConfirm.count} time slots`);
    } else {
      const ids = allTables
        .filter((t) => deleteConfirm.zone === "all" || t.zone === deleteConfirm.zone)
        .map((t) => t.id);
      removeTableIds(ids);
      const label = ZONE_LABELS[deleteConfirm.zone];
      toast.success(
        deleteConfirm.zone === "all"
          ? `Removed ${ids.length} tables`
          : `Removed ${ids.length} ${label} tables`,
      );
    }
    setDeleteConfirm(null);
  };

  const tables = useMemo(
    () => getTablesWithStatus(date, time, guests, zone, allTables, reservations),
    [date, time, guests, zone, allTables, reservations],
  );

  const dayReservations = useMemo(
    () => getReservationsForDate(date, reservations),
    [date, reservations],
  );
  const recentReservations = useMemo(
    () => getRecentReservations(20, reservations),
    [reservations],
  );
  const stats = useMemo(
    () => getDayStats(date, reservations),
    [date, reservations],
  );

  const selectedReservation = useMemo(
    () =>
      selectedReservationId
        ? getReservationById(selectedReservationId, reservations)
        : null,
    [selectedReservationId, reservations],
  );

  const openReservationDetail = (reservation: Reservation) => {
    setSelectedReservationId(reservation.id);
    setSelectedTableId(reservation.tableId);
    setTime(reservation.time);
    setDate(reservation.date);
    setDetailOpen(true);
  };

  const handleApproveReservation = () => {
    if (!selectedReservation || selectedReservation.status !== "pending") return;
    updateStatus.mutate({ id: selectedReservation.id, status: "confirmed" });
  };

  const handleTableSelect = (tableId: string, reservation?: Reservation) => {
    setSelectedTableId(tableId);
    if (reservation) {
      openReservationDetail(reservation);
    } else {
      setSelectedReservationId(null);
    }
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
        <Tabs value={view} onValueChange={(v) => setView(v as "floor" | "list" | "recent")}>
          <TabsList className="rounded-xl h-10 w-full max-w-md sm:max-w-none sm:w-auto">
            <TabsTrigger value="floor" className="rounded-lg gap-1.5 flex-1 sm:flex-none">
              <LayoutGrid className="size-4 shrink-0" /> Floor plan
            </TabsTrigger>
            <TabsTrigger value="recent" className="rounded-lg gap-1.5 flex-1 sm:flex-none">
              <Clock className="size-4 shrink-0" /> Recent
            </TabsTrigger>
            <TabsTrigger value="list" className="rounded-lg gap-1.5 flex-1 sm:flex-none">
              <List className="size-4 shrink-0" /> All reservations
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

      {isError && (
        <motion.div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex flex-wrap items-center justify-between gap-2">
          <span>Could not load reservations. Check your connection and try again.</span>
          <Button type="button" variant="outline" size="sm" className="rounded-xl" onClick={() => refetch()}>
            Retry
          </Button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="space-y-4 min-w-0"
      >
        <AnimatePresence mode="wait">
          {view === "floor" && (
            <motion.div
              key="floor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {/* Time slots */}
              <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Time</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setManageTimeOpen(true)}
                    className="h-9 rounded-xl"
                  >
                    <Pencil className="size-4" />
                    Edit time slots
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((slot) => {
                    const { free, total } = getSlotAvailability(
                      date,
                      slot,
                      guests,
                      allTables,
                      reservations,
                    );
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

              {/* Zone filter + add table */}
              <motion.div className="flex w-full flex-col items-center gap-3 sm:flex-row sm:items-center sm:justify-between">
                <motion.div className="flex flex-wrap justify-center gap-2 sm:justify-start">
                  {ZONES.map((z) => (
                    <Button
                      key={z}
                      variant={zone === z ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-xl",
                        zone === z &&
                          "bg-gradient-amber border-0 text-primary-foreground shadow-glow",
                      )}
                      onClick={() => setZone(z)}
                    >
                      {ZONE_LABELS[z]}
                    </Button>
                  ))}
                </motion.div>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={tablesInZoneScope.length === 0}
                    onClick={() =>
                      setDeleteConfirm({
                        mode: "bulk",
                        zone,
                        count: tablesInZoneScope.length,
                      })
                    }
                    className="h-10 w-full rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive sm:min-w-[9.5rem] sm:w-auto"
                  >
                    <Trash2 className="size-4" />
                    Delete tables
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setAddTableOpen(true)}
                    className="h-10 w-full rounded-xl border-0 bg-gradient-amber text-primary-foreground shadow-glow hover:opacity-95 sm:min-w-[9.5rem] sm:w-auto"
                  >
                    <Plus className="size-4" />
                    Add table
                  </Button>
                </div>
              </motion.div>

              {/* Table grid */}
              <div>
                <div className="mb-3">
                  <p className="text-sm font-medium">Table status</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Website bookings and floor layout · {date}
                  </p>
                </div>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <AnimatePresence mode="popLayout">
                    {tables.map((table, i) => (
                      <TableCard
                        key={table.id}
                        table={table}
                        index={i}
                        selected={selectedTableId === table.id}
                        onSelect={() => handleTableSelect(table.id, table.reservation)}
                        onDelete={() =>
                          setDeleteConfirm({
                            mode: "single",
                            table: {
                              id: table.id,
                              name: table.name,
                              zone: table.zone,
                              seats: table.seats,
                              premium: table.premium,
                              details: table.details,
                            },
                          })
                        }
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}

          {view === "recent" && (
            <motion.div
              key="recent"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-display text-lg">Recent bookings</h3>
                <p className="text-sm text-muted-foreground">
                  Latest reservations by when they were created
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="px-4 py-3 text-left font-medium">Booked</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Time</th>
                      <th className="px-4 py-3 text-left font-medium">Table</th>
                      <th className="px-4 py-3 text-left font-medium">Guest</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                      <th className="px-4 py-3 text-left font-medium">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`sk-recent-${i}`} className="border-b border-border/80">
                          <td className="px-4 py-3" colSpan={7}>
                            <Skeleton className="h-5 w-full rounded-lg" />
                          </td>
                        </tr>
                      ))}
                    {!isLoading &&
                      recentReservations.map((r, i) => {
                      const tableName = reservationTableName(r, allTables);
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => openReservationDetail(r)}
                          className={cn(
                            "border-b border-border/80 cursor-pointer transition-colors hover:bg-muted/40",
                            selectedReservationId === r.id && "bg-primary/5",
                            r.status === "cancelled" && "opacity-50",
                          )}
                        >
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            {formatDistanceToNow(new Date(r.createdAt), { addSuffix: true })}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">{r.date}</td>
                          <td className="px-4 py-3">{formatTimeSlot(r.time)}</td>
                          <td className="px-4 py-3 font-medium">{tableName}</td>
                          <td className="px-4 py-3">{r.guestName}</td>
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

          {view === "list" && (
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
                    {isLoading &&
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={`sk-list-${i}`} className="border-b border-border/80">
                          <td className="px-4 py-3" colSpan={6}>
                            <Skeleton className="h-5 w-full rounded-lg" />
                          </td>
                        </tr>
                      ))}
                    {!isLoading &&
                      dayReservations.map((r, i) => {
                      const tableName = reservationTableName(r, allTables);
                      return (
                        <motion.tr
                          key={r.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.03 }}
                          onClick={() => openReservationDetail(r)}
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

      <AddTableDialog
        open={addTableOpen}
        onOpenChange={setAddTableOpen}
        existingIds={allTables.map((t) => t.id)}
        onAdd={(table) => setCustomTables((prev) => [...prev, table])}
      />

      <ManageTimeSlotsDialog
        open={manageTimeOpen}
        onOpenChange={setManageTimeOpen}
        timeSlots={timeSlots}
        dayReservations={dayReservations}
        onAdd={(slot) => setCustomTimeSlots((prev) => [...prev, slot])}
        onRemove={(slot) => setDeleteConfirm({ mode: "time", slot })}
        onRequestRemoveAll={() =>
          setDeleteConfirm({ mode: "times-bulk", count: timeSlots.length })
        }
      />

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="flex w-full flex-col gap-0 overflow-y-auto p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-6 py-5 text-left">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Reservation details
            </p>
            <SheetTitle className="font-display text-xl">Guest summary</SheetTitle>
            <SheetDescription className="sr-only">
              Full booking and guest information
            </SheetDescription>
          </SheetHeader>
          <div className="flex-1 px-6 py-5">
            {selectedReservation ? (
              <ReservationDetailPanel
                reservation={selectedReservation}
                allTables={allTables}
                isUpdating={updateStatus.isPending}
                onApprove={handleApproveReservation}
                onDelete={() =>
                  setDeleteConfirm({ mode: "reservation", reservation: selectedReservation })
                }
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              {deleteConfirm?.mode === "single"
                ? `Delete ${deleteConfirm.table.name}?`
                : deleteConfirm?.mode === "reservation"
                  ? `Delete reservation for ${deleteConfirm.reservation.guestName}?`
                  : deleteConfirm?.mode === "time"
                    ? `Delete ${formatTimeSlot(deleteConfirm.slot)}?`
                    : deleteConfirm?.mode === "times-bulk"
                      ? `Delete all ${deleteConfirm.count} time slots?`
                      : deleteConfirm?.zone === "all"
                        ? `Delete all ${deleteConfirm.count} tables?`
                        : `Delete ${deleteConfirm?.count} ${ZONE_LABELS[deleteConfirm?.zone ?? "all"]} tables?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.mode === "single" ? (
                <>
                  Remove this table from the floor map for this session. Reservations linked to it
                  may still appear in the list view.
                </>
              ) : deleteConfirm?.mode === "reservation" ? (
                <>
                  Remove this booking from the floor plan and lists for this session. This cannot be
                  undone until you refresh the page.
                </>
              ) : deleteConfirm?.mode === "time" ? (
                <>
                  Remove this time from the floor plan for this session. Existing reservations at
                  this time may still appear in lists.
                </>
              ) : deleteConfirm?.mode === "times-bulk" ? (
                <>
                  Remove every time slot from the floor plan for this session. This cannot be undone
                  until you refresh the page.
                </>
              ) : deleteConfirm?.zone === "all" ? (
                <>
                  Remove every table from the floor map for this session. This cannot be undone
                  until you refresh the page.
                </>
              ) : (
                <>
                  Remove all {ZONE_LABELS[deleteConfirm?.zone ?? "all"]} tables from the floor map
                  for this session.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
