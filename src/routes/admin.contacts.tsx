import { createFileRoute } from "@tanstack/react-router";
import AdminContacts from "@/pages/admin/Contacts";

export const Route = createFileRoute("/admin/contacts")({
  component: AdminContacts,
});