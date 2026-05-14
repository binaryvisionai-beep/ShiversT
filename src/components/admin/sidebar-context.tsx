import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Ctx = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggle: () => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarCtx = createContext<Ctx | null>(null);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1180 : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let userTouched = false;
    const onResize = () => {
      if (userTouched) return;
      setCollapsed(window.innerWidth < 1180);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return (
    <SidebarCtx.Provider
      value={{
        collapsed,
        setCollapsed,
        toggle: () => setCollapsed(!collapsed),
        mobileOpen,
        setMobileOpen,
      }}
    >
      {children}
    </SidebarCtx.Provider>
  );
}

export function useSidebarState() {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error("useSidebarState must be used inside SidebarProvider");
  return ctx;
}
