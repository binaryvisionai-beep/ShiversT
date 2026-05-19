export type Zone = "garden" | "indoor" | "terrace";

export type ZoneFilter = "all" | Zone;

export type TableDisplayStatus = "available" | "reserved" | "unavailable" | "premium";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type ReservationSource = "website" | "admin" | "walk-in";

export type RestaurantTable = {
  id: string;
  name: string;
  zone: Zone;
  seats: number;
  premium?: boolean;
  details?: string;
};

export type RestaurantReservation = {
  id: string;
  reference_code?: string | null;
  status: ReservationStatus;
  reservation_date: string;
  reservation_time: string;
  /** Live DB column from public site */
  guests?: number | null;
  guest_count?: number | null;
  table_id: string;
  table_label: string;
  table_zone: string;
  table_seats?: number | null;
  is_premium_table?: boolean | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  guest_name?: string | null;
  guest_phone?: string | null;
  guest_email?: string | null;
  special_requests?: string | null;
  source?: string | null;
  created_at: string;
  updated_at?: string | null;
};

export type Reservation = {
  id: string;
  date: string;
  time: string;
  guests: number;
  tableId: string;
  tableLabel?: string;
  tableZone?: string;
  isPremiumTable?: boolean;
  guestName: string;
  phone: string;
  email?: string;
  notes?: string;
  status: ReservationStatus;
  source: ReservationSource;
  createdAt: string;
};

export type TableWithStatus = RestaurantTable & {
  displayStatus: TableDisplayStatus;
  reservation?: Reservation;
};
