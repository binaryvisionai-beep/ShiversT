import { createFileRoute } from "@tanstack/react-router";
import AdminHomepagePage from "@/pages/admin/homepage";

export const Route = createFileRoute("/admin/homepage")({
  component: AdminHomepagePage,
});