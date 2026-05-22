import { createFileRoute } from "@tanstack/react-router";
import AboutAdminPage from "@/pages/admin/About";

export const Route = createFileRoute("/admin/about")({
  component: AboutAdminPage,
});