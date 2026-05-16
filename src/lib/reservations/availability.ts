import { BLOCKED_SLOTS, MOCK_RESERVATIONS } from "./mock-reservations";
import { RESTAURANT_TABLES } from "./tables";
import { TIME_SLOTS } from "./time-slots";
import type {
  Reservation,
  ReservationStatus,
  RestaurantTable,
  TableDisplayStatus,
  TableWithStatus,
  ZoneFilter,
} from "./types";

const ACTIVE_STATUSES: ReservationStatus[] = ["confirmed", "pending"];

export function getReservationsForDate(date: string): Reservation[] {
  return MOCK_RESERVATIONS.filter((r) => r.date === date);
}

export function getReservationAtSlot(
  date: string,
  time: string,
  tableId: string,
): Reservation | undefined {
  return MOCK_RESERVATIONS.find(
    (r) =>
      r.date === date &&
      r.time === time &&
      r.tableId === tableId &&
      ACTIVE_STATUSES.includes(r.status),
  );
}

export function isTableBlocked(date: string, time: string, tableId: string): boolean {
  return BLOCKED_SLOTS.some(
    (b) => b.date === date && b.time === time && b.tableId === tableId,
  );
}

export function getTableDisplayStatus(
  table: RestaurantTable,
  date: string,
  time: string,
  guests: number,
): { displayStatus: TableDisplayStatus; reservation?: Reservation } {
  if (isTableBlocked(date, time, table.id)) {
    return { displayStatus: "unavailable" };
  }

  const reservation = getReservationAtSlot(date, time, table.id);
  if (reservation) {
    return { displayStatus: "reserved", reservation };
  }

  if (table.seats < guests) {
    return { displayStatus: "unavailable" };
  }

  if (table.premium) {
    return { displayStatus: "premium" };
  }

  return { displayStatus: "available" };
}

export function getTablesWithStatus(
  date: string,
  time: string,
  guests: number,
  zone: ZoneFilter,
): TableWithStatus[] {
  return RESTAURANT_TABLES.filter((t) => zone === "all" || t.zone === zone).map((table) => {
    const { displayStatus, reservation } = getTableDisplayStatus(table, date, time, guests);
    return { ...table, displayStatus, reservation };
  });
}

export function getSlotAvailability(
  date: string,
  time: string,
  guests: number,
): { free: number; total: number } {
  let free = 0;
  const total = RESTAURANT_TABLES.length;
  for (const table of RESTAURANT_TABLES) {
    const { displayStatus } = getTableDisplayStatus(table, date, time, guests);
    if (displayStatus === "available" || displayStatus === "premium") free++;
  }
  return { free, total };
}

export function getDayStats(date: string) {
  const dayReservations = getReservationsForDate(date).filter((r) =>
    ACTIVE_STATUSES.includes(r.status),
  );
  const covers = dayReservations.reduce((s, r) => s + r.guests, 0);
  const confirmed = dayReservations.filter((r) => r.status === "confirmed").length;
  const pending = dayReservations.filter((r) => r.status === "pending").length;
  const website = dayReservations.filter((r) => r.source === "website").length;
  return { covers, confirmed, pending, website, total: dayReservations.length };
}

export { TIME_SLOTS };
