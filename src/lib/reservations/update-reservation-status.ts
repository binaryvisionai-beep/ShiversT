import { mapDbRowToReservation } from "@/lib/reservations/map-reservation";
import type { Reservation, ReservationStatus } from "@/lib/reservations/types";
import { supabase } from "@/lib/supabase";

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
): Promise<Reservation> {
  const { data, error } = await supabase
    .from("restaurant_reservations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapDbRowToReservation(data);
}
