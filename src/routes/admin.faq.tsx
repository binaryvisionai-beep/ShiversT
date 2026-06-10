import { createFileRoute } from "@tanstack/react-router";
import FAQPage from "@/pages/admin/FAQ";

export const Route = createFileRoute("/admin/faq")({
  component: FAQPage,
});
