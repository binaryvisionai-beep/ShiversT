import { mapDbRowToReservation } from "@/lib/reservations/map-reservation";
import type { Reservation } from "@/lib/reservations/types";
import { supabase } from "@/lib/supabase";

export async function fetchReservations(): Promise<Reservation[]> {
  const { data, error } = await supabase
    .from("restaurant_reservations")
    .select("*")
    .order("reservation_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapDbRowToReservation);
}
