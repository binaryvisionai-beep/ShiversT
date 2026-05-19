export const RESERVATIONS_QUERY_KEY = "reservations";

export function reservationsQueryKey() {
  return [RESERVATIONS_QUERY_KEY] as const;
}
