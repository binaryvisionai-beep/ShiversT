import { createFileRoute } from "@tanstack/react-router";
import EventsAdminPage from "@/pages/admin/Events";

export const Route = createFileRoute("/admin/events")({
  component: EventsAdminPage,
});