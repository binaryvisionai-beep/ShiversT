import { BLOCKED_SLOTS } from "./blocked-slots";
import { RESTAURANT_TABLES } from "./tables";
import { parseReservationTimeTo24h, TIME_SLOTS } from "./time-slots";
import type {
  Reservation,
  ReservationStatus,
  RestaurantTable,
  TableDisplayStatus,
  TableWithStatus,
  ZoneFilter,
} from "./types";

const ACTIVE_STATUSES: ReservationStatus[] = ["confirmed", "pending"];

export type ReservationOverrides = {
  patches: Record<string, Partial<Reservation>>;
  removedIds: Set<string>;
};

function resolveReservations(
  all: Reservation[],
  overrides?: ReservationOverrides,
): Reservation[] {
  const patches = overrides?.patches ?? {};
  const removed = overrides?.removedIds ?? new Set<string>();
  return all
    .filter((r) => !removed.has(r.id))
    .map((r) => ({ ...r, ...patches[r.id] }));
}

export function getReservationById(
  id: string,
  all: Reservation[],
  overrides?: ReservationOverrides,
): Reservation | undefined {
  return resolveReservations(all, overrides).find((r) => r.id === id);
}

export function getReservationsForDate(
  date: string,
  all: Reservation[],
  overrides?: ReservationOverrides,
): Reservation[] {
  return resolveReservations(all, overrides).filter((r) => r.date === date);
}

export function getRecentReservations(
  limit: number,
  all: Reservation[],
  overrides?: ReservationOverrides,
): Reservation[] {
  return resolveReservations(all, overrides)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getReservationAtSlot(
  date: string,
  time: string,
  tableId: string,
  all: Reservation[],
  overrides?: ReservationOverrides,
): Reservation | undefined {
  const slotTime = parseReservationTimeTo24h(time);
  return resolveReservations(all, overrides).find(
    (r) =>
      r.date === date &&
      parseReservationTimeTo24h(r.time) === slotTime &&
      r.tableId.toLowerCase() === tableId.toLowerCase() &&
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
  all: Reservation[],
  overrides?: ReservationOverrides,
): { displayStatus: TableDisplayStatus; reservation?: Reservation } {
  if (isTableBlocked(date, time, table.id)) {
    return { displayStatus: "unavailable" };
  }

  const reservation = getReservationAtSlot(date, time, table.id, all, overrides);
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
  tables: RestaurantTable[],
  all: Reservation[],
  overrides?: ReservationOverrides,
): TableWithStatus[] {
  return tables.filter((t) => zone === "all" || t.zone === zone).map((table) => {
    const { displayStatus, reservation } = getTableDisplayStatus(
      table,
      date,
      time,
      guests,
      all,
      overrides,
    );
    return { ...table, displayStatus, reservation };
  });
}

export function getSlotAvailability(
  date: string,
  time: string,
  guests: number,
  tables: RestaurantTable[],
  all: Reservation[],
  overrides?: ReservationOverrides,
): { free: number; total: number } {
  let free = 0;
  const total = tables.length;
  for (const table of tables) {
    const { displayStatus } = getTableDisplayStatus(
      table,
      date,
      time,
      guests,
      all,
      overrides,
    );
    if (displayStatus === "available" || displayStatus === "premium") free++;
  }
  return { free, total };
}

export function getDayStats(
  date: string,
  all: Reservation[],
  overrides?: ReservationOverrides,
) {
  const dayReservations = getReservationsForDate(date, all, overrides).filter((r) =>
    ACTIVE_STATUSES.includes(r.status),
  );
  const covers = dayReservations.reduce((s, r) => s + r.guests, 0);
  const confirmed = dayReservations.filter((r) => r.status === "confirmed").length;
  const pending = dayReservations.filter((r) => r.status === "pending").length;
  const website = dayReservations.filter((r) => r.source === "website").length;
  return { covers, confirmed, pending, website, total: dayReservations.length };
}

export { TIME_SLOTS };
