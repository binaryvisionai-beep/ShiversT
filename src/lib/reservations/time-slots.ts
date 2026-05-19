export const TIME_SLOTS = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
] as const;

export type TimeSlot = (typeof TIME_SLOTS)[number];

export function formatTimeSlot(time: string): string {
  const t24 = parseReservationTimeTo24h(time);
  const [h, m] = t24.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return time;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m.toString().padStart(2, "0")} ${period}`;
}

/** Normalize DB or UI time to 24h HH:mm for slot matching. */
export function parseReservationTimeTo24h(time: string): string {
  const normalized = normalizeTimeSlot(time);
  if (normalized) return normalized;

  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(time.trim());
  if (!match) return time.trim();

  let h = Number(match[1]);
  const m = Number(match[2]);
  const period = match[3].toUpperCase();
  if (period === "PM" && h !== 12) h += 12;
  if (period === "AM" && h === 12) h = 0;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

const DEFAULT_SLOT_SET = new Set<string>(TIME_SLOTS);

/** Normalize HTML time input or HH:mm to 24h HH:mm */
export function normalizeTimeSlot(value: string): string | null {
  const trimmed = value.trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function buildEffectiveTimeSlots(
  customSlots: string[],
  removedSlots: Set<string>,
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const slot of [...TIME_SLOTS, ...customSlots]) {
    if (!removedSlots.has(slot) && !seen.has(slot)) {
      seen.add(slot);
      result.push(slot);
    }
  }
  return result.sort((a, b) => a.localeCompare(b));
}

export function isDefaultTimeSlot(slot: string): boolean {
  return DEFAULT_SLOT_SET.has(slot);
}
