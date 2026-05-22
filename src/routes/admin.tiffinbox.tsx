import { createFileRoute } from "@tanstack/react-router";
import TiffinBoxAdminPage from "@/pages/admin/tiffinbox";

export const Route = createFileRoute("/admin/tiffinbox")({
  component: TiffinBoxAdminRoute,
});

function TiffinBoxAdminRoute() {
  return <TiffinBoxAdminPage />;
}