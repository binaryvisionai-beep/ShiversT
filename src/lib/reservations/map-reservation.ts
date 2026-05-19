import { parseReservationTimeTo24h } from "@/lib/reservations/time-slots";
import type {
  Reservation,
  ReservationSource,
  RestaurantReservation,
} from "@/lib/reservations/types";

function toSource(source: string): ReservationSource {
  if (source === "website" || source === "admin" || source === "walk-in") {
    return source;
  }
  return "website";
}

export function mapDbRowToReservation(row: RestaurantReservation): Reservation {
  return {
    id: row.id,
    date: row.reservation_date,
    time: parseReservationTimeTo24h(row.reservation_time),
    guests: row.guests ?? row.guest_count ?? 0,
    tableId: row.table_id,
    tableLabel: row.table_label,
    tableZone: row.table_zone,
    isPremiumTable: row.is_premium_table ?? false,
    guestName: row.customer_name ?? row.guest_name ?? "",
    phone: row.customer_phone ?? row.guest_phone ?? "",
    email: row.customer_email ?? row.guest_email ?? undefined,
    notes: row.special_requests ?? undefined,
    status: row.status,
    source: toSource(row.source ?? "website"),
    createdAt: row.created_at,
  };
}
