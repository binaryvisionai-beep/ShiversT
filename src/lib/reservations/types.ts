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
};

export type Reservation = {
  id: string;
  date: string;
  time: string;
  guests: number;
  tableId: string;
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
