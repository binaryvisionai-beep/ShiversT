import { useRouterState, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Menu,
  Search,
  Bell,
  MessageSquare,
  Download,
  ChevronDown,
  Sun,
  ChevronRight,
} from "lucide-react";
import { useSidebarState } from "./sidebar-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const LABELS: Record<string, string> = {
  admin: "Dashboard",
  bookings: "Bookings",
  reservations: "Reservations",
  rooms: "Rooms",
  restaurant: "Restaurant",
  events: "Events",
  gallery: "Gallery",
  messages: "Messages",
  analytics: "Analytics",
  users: "Users",
  settings: "Settings",
};

export function AdminTopbar() {
  const { setMobileOpen } = useSidebarState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="sticky top-0 z-30 h-16 px-4 md:px-8 flex items-center gap-3 border-b border-border glass">
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden size-9 rounded-lg hover:bg-accent flex items-center justify-center"
      >
        <Menu className="size-5" />
      </button>

      {/* Breadcrumbs */}
      <div className="hidden md:flex items-center text-sm text-muted-foreground">
        {segments.map((seg, i) => {
          const isLast = i === segments.length - 1;
          const href = "/" + segments.slice(0, i + 1).join("/");
          return (
            <div key={href} className="flex items-center">
              {i > 0 && <ChevronRight className="size-3.5 mx-1.5 text-muted-foreground/50" />}
              <Link
                to={href}
                className={
                  isLast
                    ? "font-medium text-foreground"
                    : "hover:text-foreground transition-colors"
                }
              >
                {LABELS[seg] ?? seg.charAt(0).toUpperCase() + seg.slice(1)}
              </Link>
            </div>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden lg:flex relative w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          placeholder="Search anything..."
          className="w-full h-10 pl-9 pr-3 rounded-xl bg-muted/60 border border-transparent text-sm placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:border-border focus:ring-2 focus:ring-primary/30 transition-all"
        />
      </div>

      <Button variant="outline" size="sm" className="hidden md:inline-flex gap-2 rounded-xl">
        <Download className="size-4" />
        Export
      </Button>

      <IconBtn>
        <Sun className="size-[18px]" />
      </IconBtn>

      <IconBtn badge>
        <MessageSquare className="size-[18px]" />
      </IconBtn>

      <IconBtn badge>
        <Bell className="size-[18px]" />
      </IconBtn>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 pl-1 pr-2 h-10 rounded-xl hover:bg-accent transition-colors">
            <div className="size-8 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee">
              AM
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-sm font-medium">Amelia M.</span>
              <span className="text-[11px] text-muted-foreground">Manager</span>
            </div>
            <ChevronDown className="size-4 text-muted-foreground hidden md:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Preferences</DropdownMenuItem>
          <DropdownMenuItem>Billing</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

function IconBtn({ children, badge }: { children: React.ReactNode; badge?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      className="relative size-10 rounded-xl hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
      {badge && (
        <span className="absolute top-2 right-2 size-2 rounded-full bg-primary ring-2 ring-background" />
      )}
    </motion.button>
  );
}
