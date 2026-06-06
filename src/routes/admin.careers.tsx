// import { createFileRoute } from '@tanstack/react-router'

// export const Route = createFileRoute('/admin/careers')({
//   component: RouteComponent,
// })

// function RouteComponent() {
//   return <div>Hello "/admin/careers"!</div>
// }
import { createFileRoute } from "@tanstack/react-router";
import CareersAdminPage from "@/pages/admin/Careers";

export const Route = createFileRoute("/admin/careers")({
  component: CareersAdminPage,
});