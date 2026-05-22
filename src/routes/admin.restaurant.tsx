import { createFileRoute } from "@tanstack/react-router";
import RestaurantAdminPage from "@/pages/admin/Restaurant";

export const Route = createFileRoute("/admin/restaurant")({
  component: RestaurantAdminPage,
});