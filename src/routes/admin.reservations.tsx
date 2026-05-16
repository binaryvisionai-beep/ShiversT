import { createFileRoute } from "@tanstack/react-router";
import { ReservationsPage } from "@/components/admin/reservations/reservations-page";

export const Route = createFileRoute("/admin/reservations")({
  component: ReservationsPage,
});
