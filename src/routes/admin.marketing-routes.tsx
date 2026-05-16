import { createFileRoute } from "@tanstack/react-router";
import { PlaceholderPage } from "@/components/admin/placeholder-page";

export const Route = createFileRoute("/admin/marketing-routes")({
  component: () => (
    <PlaceholderPage
      title="Marketing Page Routes"
      description="Manage public marketing pages, landing URLs, and navigation paths."
    />
  ),
});
