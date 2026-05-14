import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarProvider, useSidebarState } from "@/components/admin/sidebar-context";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <SidebarProvider>
      <Shell />
    </SidebarProvider>
  );
}

function Shell() {
  const { collapsed } = useSidebarState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const ml = collapsed ? 80 : 280;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AdminSidebar />
      <motion.div
        animate={{ marginLeft: ml }}
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        className="md:ml-[280px] min-h-screen flex flex-col"
        style={{ marginLeft: undefined }}
      >
        <div className="hidden md:block" style={{ marginLeft: 0 }} />
        <AdminTopbar />
        <main className="flex-1 p-4 md:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </div>
  );
}
