import { motion, AnimatePresence } from "framer-motion";
import { Globe, Mail, MapPin, Phone, Sparkles, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RESTAURANT_TABLES, VENUE_NAME, ZONE_LABELS } from "@/lib/reservations/tables";
import { formatTimeSlot } from "@/lib/reservations/time-slots";
import type { Reservation, RestaurantTable } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-primary/10 text-primary border-primary/20",
    pending: "bg-gold/15 text-bronze border-gold/30",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return (
    <Badge variant="outline" className={cn("rounded-full font-normal capitalize", map[status])}>
      <span className="size-1.5 rounded-full bg-current mr-1.5" />
      {status}
    </Badge>
  );
}

function SourceBadge({ source }: { source: string }) {
  const labels: Record<string, string> = {
    website: "Website",
    admin: "Admin",
    "walk-in": "Walk-in",
  };
  return (
    <Badge variant="outline" className="rounded-full font-normal">
      {source === "website" && <Globe className="size-3 mr-1" />}
      {labels[source] ?? source}
    </Badge>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-right">{value || "—"}</span>
    </div>
  );
}

export function ReservationDetailPanel({
  reservation,
  table,
  date,
  time,
  guests,
}: {
  reservation: Reservation | null;
  table: RestaurantTable | null;
  date: string;
  time: string;
  guests: number;
}) {
  const tableMeta = table ?? (reservation ? RESTAURANT_TABLES.find((t) => t.id === reservation.tableId) : null);

  return (
    <motion.div className="rounded-2xl border border-border bg-card shadow-soft h-full flex flex-col overflow-hidden">
      <motion.div className="p-5 border-b border-border bg-muted/30">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Reservation details</p>
        <h3 className="font-display text-xl mt-1">Guest summary</h3>
      </motion.div>

      <motion.div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
        <AnimatePresence mode="wait">
          {reservation ? (
            <motion.div
              key={reservation.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <motion.div className="flex flex-wrap gap-2">
                <StatusBadge status={reservation.status} />
                <SourceBadge source={reservation.source} />
                {tableMeta?.premium && (
                  <Badge className="rounded-full bg-gradient-gold text-coffee border-0">Premium</Badge>
                )}
              </motion.div>

              <motion.div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <DetailRow label="Date" value={reservation.date} />
                <DetailRow label="Time" value={formatTimeSlot(reservation.time)} />
                <DetailRow label="Guests" value={String(reservation.guests)} />
                <DetailRow
                  label="Table"
                  value={
                    tableMeta
                      ? `${tableMeta.name} (${ZONE_LABELS[tableMeta.zone]})`
                      : reservation.tableId
                  }
                />
              </motion.div>

              <motion.div className="space-y-3">
                <motion.div className="flex items-center gap-2 text-sm">
                  <User className="size-4 text-muted-foreground" />
                  <span className="font-medium">{reservation.guestName}</span>
                </motion.div>
                <motion.div className="flex items-center gap-2 text-sm">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{reservation.phone}</span>
                </motion.div>
                {reservation.email && (
                  <motion.div className="flex items-center gap-2 text-sm">
                    <Mail className="size-4 text-muted-foreground" />
                    <span className="truncate">{reservation.email}</span>
                  </motion.div>
                )}
              </motion.div>

              {reservation.notes && (
                <motion.div className="rounded-xl border border-border p-3 text-sm">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
                    Special requests
                  </p>
                  <p className="text-foreground/90">{reservation.notes}</p>
                </motion.div>
              )}

              <motion.div className="flex gap-2 pt-2">
                <Button className="flex-1 rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95">
                  Confirm
                </Button>
                <Button variant="outline" className="rounded-xl">
                  Cancel
                </Button>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center py-10 px-4"
            >
              <motion.div className="size-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <Sparkles className="size-6 text-muted-foreground" />
              </motion.div>
              <p className="font-display text-lg">No reservation selected</p>
              <p className="text-sm text-muted-foreground mt-2 max-w-[220px]">
                Select a booked table or a row in the list to view guest details from the website.
              </p>
              <motion.div className="mt-6 w-full rounded-xl border border-dashed border-border p-4 space-y-2 text-left text-sm">
                <DetailRow label="Date" value={date} />
                <DetailRow label="Time" value={time ? formatTimeSlot(time) : "—"} />
                <DetailRow label="Guests" value={String(guests)} />
                <DetailRow label="Table" value={tableMeta?.name ?? "—"} />
              </motion.div>
              <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 justify-center">
                <MapPin className="size-3" /> {VENUE_NAME}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
