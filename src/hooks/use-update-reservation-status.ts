import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { RESERVATIONS_QUERY_KEY } from "@/lib/reservations/query-keys";
import type { ReservationStatus } from "@/lib/reservations/types";
import { updateReservationStatus } from "@/lib/reservations/update-reservation-status";

export function useUpdateReservationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      updateReservationStatus(id, status),
    onSuccess: (_data, { status }) => {
      void queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] });
      toast.success(
        status === "confirmed" ? "Reservation approved" : "Reservation cancelled",
      );
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
