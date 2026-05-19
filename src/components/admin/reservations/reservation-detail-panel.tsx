import { formatDistanceToNow } from "date-fns";
import { Globe, Mail, MapPin, Phone, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { VENUE_NAME, ZONE_LABELS } from "@/lib/reservations/tables";
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
  allTables,
  onApprove,
  onDelete,
  isUpdating = false,
}: {
  reservation: Reservation;
  allTables: RestaurantTable[];
  onApprove: () => void;
  onDelete: () => void;
  isUpdating?: boolean;
}) {
  const tableMeta = allTables.find(
    (t) => t.id.toLowerCase() === reservation.tableId.toLowerCase(),
  );
  const canApprove = reservation.status === "pending" && !isUpdating;
  const canDelete = reservation.status !== "cancelled" && !isUpdating;
  const tableDisplay = tableMeta
    ? `${tableMeta.name} (${ZONE_LABELS[tableMeta.zone]}) · ${tableMeta.seats} seats`
    : reservation.tableLabel
      ? `${reservation.tableLabel}${reservation.tableZone ? ` (${reservation.tableZone})` : ""}`
      : reservation.tableId;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap gap-2">
        <StatusBadge status={reservation.status} />
        <SourceBadge source={reservation.source} />
        {(tableMeta?.premium || reservation.isPremiumTable) && (
          <Badge className="rounded-full bg-gradient-gold text-coffee border-0">Premium</Badge>
        )}
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <DetailRow label="Date" value={reservation.date} />
        <DetailRow label="Time" value={formatTimeSlot(reservation.time)} />
        <DetailRow label="Guests" value={String(reservation.guests)} />
        <DetailRow label="Table" value={tableDisplay} />
        <DetailRow
          label="Booked"
          value={formatDistanceToNow(new Date(reservation.createdAt), { addSuffix: true })}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Guest</p>
        <div className="flex items-center gap-2 text-sm">
          <User className="size-4 text-muted-foreground shrink-0" />
          <span className="font-medium">{reservation.guestName}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Phone className="size-4 text-muted-foreground shrink-0" />
          <span>{reservation.phone}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Mail className="size-4 text-muted-foreground shrink-0" />
          <span className="truncate">{reservation.email ?? "—"}</span>
        </div>
      </div>

      <div className="rounded-xl border border-border p-3 text-sm">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
          Special requests
        </p>
        <p className="text-foreground/90">{reservation.notes?.trim() ? reservation.notes : "—"}</p>
      </div>

      <p className="text-xs text-muted-foreground flex items-center gap-1">
        <MapPin className="size-3 shrink-0" /> {VENUE_NAME}
      </p>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row">
        <Button
          type="button"
          disabled={!canApprove}
          onClick={onApprove}
          className="flex-1 rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95 disabled:opacity-50"
        >
          Approve
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canDelete}
          onClick={onDelete}
          className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
