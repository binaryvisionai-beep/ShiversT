import { useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchReservations } from "@/lib/reservations/fetch-reservations";
import { RESERVATIONS_QUERY_KEY, reservationsQueryKey } from "@/lib/reservations/query-keys";

export { RESERVATIONS_QUERY_KEY, reservationsQueryKey };

export function useReservations() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: reservationsQueryKey(),
    queryFn: fetchReservations,
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [RESERVATIONS_QUERY_KEY] });
  };

  return {
    reservations: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
