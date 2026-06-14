import { createFileRoute } from "@tanstack/react-router";

import EventsEditPage from "@/pages/admin/EventsEdit";

export const Route = createFileRoute("/admin/events/edit")({
  component: EventsEditPage,
});
