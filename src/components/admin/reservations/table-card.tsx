import { motion } from "framer-motion";
import { Crown, Lock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ZONE_LABELS } from "@/lib/reservations/tables";
import { formatTimeSlot } from "@/lib/reservations/time-slots";
import type { TableWithStatus } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  available:
    "border-border bg-card hover:border-primary/40 hover:shadow-lift cursor-pointer",
  reserved:
    "border-primary/50 bg-primary/5 ring-2 ring-primary/30 shadow-glow cursor-pointer",
  unavailable: "border-border/60 bg-muted/40 opacity-60 cursor-not-allowed",
  premium:
    "border-gold/40 bg-gradient-to-br from-gold/10 to-card hover:border-gold/60 hover:shadow-lift cursor-pointer",
};

export function TableCard({
  table,
  selected,
  onSelect,
  index,
}: {
  table: TableWithStatus;
  selected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const isReserved = table.displayStatus === "reserved";
  const isUnavailable = table.displayStatus === "unavailable";
  const showPremium = table.premium && !isReserved && !isUnavailable;

  return (
    <motion.button
      type="button"
      disabled={isUnavailable}
      onClick={onSelect}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      whileHover={!isUnavailable ? { y: -3 } : undefined}
      whileTap={!isUnavailable ? { scale: 0.98 } : undefined}
      className={cn(
        "relative w-full text-left rounded-2xl border p-4 transition-shadow",
        statusStyles[table.displayStatus],
        selected && "ring-2 ring-primary shadow-glow",
        isReserved && selected && "ring-primary",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-display text-lg leading-tight">{table.name}</p>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            {ZONE_LABELS[table.zone]} · <Users className="size-3" /> Seats {table.seats}
          </p>
        </div>
        {showPremium && (
          <Badge className="rounded-full bg-gradient-gold text-coffee border-0 shrink-0">
            <Crown className="size-3 mr-0.5" /> Premium
          </Badge>
        )}
        {isUnavailable && !isReserved && (
          <Lock className="size-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {isReserved && table.reservation && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-3 pt-3 border-t border-border/80"
        >
          <p className="text-xs font-medium text-primary capitalize">{table.reservation.status}</p>
          <p className="text-sm font-medium mt-0.5 truncate">{table.reservation.guestName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatTimeSlot(table.reservation.time)} · {table.reservation.guests} guests
            {table.reservation.source === "website" && " · Website"}
          </p>
        </motion.div>
      )}

      {!isReserved && !isUnavailable && (
        <p className="text-xs text-muted-foreground mt-3">Available for booking</p>
      )}
    </motion.button>
  );
}
