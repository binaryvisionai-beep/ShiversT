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

  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ "--sb-w": collapsed ? "80px" : "280px" } as React.CSSProperties}
    >
      <AdminSidebar />
      <motion.div
        animate={{ paddingLeft: 0 }}
        className="min-h-screen flex flex-col md:[padding-left:var(--sb-w)] transition-[padding] duration-300 ease-out"
      >
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
