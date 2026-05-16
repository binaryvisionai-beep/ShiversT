import { createFileRoute } from "@tanstack/react-router";
import { AdminAuthPage } from "@/components/auth/admin-auth-page";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <AdminAuthPage />;
}
