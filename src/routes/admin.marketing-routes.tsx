// import { createFileRoute } from "@tanstack/react-router";
// import { PlaceholderPage } from "@/components/admin/placeholder-page";

// export const Route = createFileRoute("/admin/marketing-routes")({
//   component: () => (
//     <PlaceholderPage
//       title="Marketing Page Routes"
//       description="Manage public marketing pages, landing URLs, and navigation paths."
//     />
//   ),
// });


import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Home,
  BedDouble,
  UtensilsCrossed,
  PartyPopper,
  Images,
  Users,
  Phone,
  Briefcase,
  Soup,
  Search,
} from "lucide-react";

export const Route = createFileRoute("/admin/marketing-routes")({
  component: MarketingRoutesPage,
});

// ─── Site configuration ────────────────────────────────────────────────────────
const SITE_URL = "https://www.goashivers.com";

type RouteItem = {
  label: string;
  path: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

type RouteGroup = {
  group: string;
  items: RouteItem[];
};

const ROUTES: RouteGroup[] = [
  {
    group: "Core Pages",
    items: [
      { label: "Home",        path: "/",          description: "Main landing page",               icon: Home },
      { label: "About Us",    path: "/about",     description: "Story, philosophy and moments",    icon: Users },
      { label: "Contact",     path: "/contact",   description: "Location, enquiry form and map",   icon: Phone },
    ],
  },
  {
    group: "Stay & Dine",
    items: [
      { label: "Rooms",       path: "/rooms",       description: "Room types and booking",            icon: BedDouble },
      { label: "Book a Room", path: "/book",        description: "Direct room booking flow",          icon: BedDouble },
      { label: "Restaurant",  path: "/restaurant",  description: "Shivers Garden Restaurant",          icon: UtensilsCrossed },
      { label: "Reserve a Table", path: "/reserve", description: "Restaurant table reservation",      icon: UtensilsCrossed },
      { label: "Tiffin Box",  path: "/tiffinbox",   description: "The Northeast Tiffin Box",           icon: Soup },
    ],
  },
  {
    group: "Experiences",
    items: [
      { label: "Events",      path: "/events",   description: "Romantic Dinner, Sunday Roast, Corporate, Christmas Festival", icon: PartyPopper },
      { label: "Gallery",     path: "/gallery",  description: "Instagram-style photo feed",        icon: Images },
    ],
  },
  {
    group: "Other",
    items: [
      { label: "Careers",     path: "/careers",  description: "Job application form",              icon: Briefcase },
    ],
  },
];

const TOTAL_ROUTES = ROUTES.reduce((sum, g) => sum + g.items.length, 0);

// ─── Copy button ────────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border text-xs font-medium transition-colors hover:bg-muted shrink-0"
      title="Copy full URL"
    >
      <motion.span
        key={copied ? "check" : "copy"}
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="inline-flex items-center gap-1.5"
      >
        {copied ? (
          <>
            <Check className="size-3.5 text-green-600" />
            <span className="text-green-600">Copied</span>
          </>
        ) : (
          <>
            <Copy className="size-3.5" />
            Copy
          </>
        )}
      </motion.span>
    </button>
  );
}

// ─── Route row ──────────────────────────────────────────────────────────────────
function RouteRow({ item, index }: { item: RouteItem; index: number }) {
  const fullUrl = `${SITE_URL}${item.path}`;
  const Icon = item.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.03 }}
      className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3.5 hover:border-primary/30 hover:shadow-soft transition-all"
    >
      {/* Icon */}
      <div className="size-10 rounded-xl bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
        <Icon className="size-4.5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>

      {/* Label + path */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm">{item.label}</p>
          <code className="text-[11px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono">
            {item.path}
          </code>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.description}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <CopyButton text={fullUrl} />
        <a
          href={fullUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center size-9 rounded-xl border hover:bg-muted transition-colors"
          title="Open in new tab"
        >
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
function MarketingRoutesPage() {
  const [search, setSearch] = useState("");
  const [copiedAll, setCopiedAll] = useState(false);

  const q = search.trim().toLowerCase();

  const filteredGroups = ROUTES.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) =>
        !q ||
        item.label.toLowerCase().includes(q) ||
        item.path.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
    ),
  })).filter((g) => g.items.length > 0);

  const handleCopyAll = async () => {
    const allUrls = ROUTES.flatMap((g) => g.items.map((i) => `${item_label(i)}: ${SITE_URL}${i.path}`)).join("\n");
    try {
      await navigator.clipboard.writeText(allUrls);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      // ignore
    }
  };

  function item_label(i: RouteItem) {
    return i.label;
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          {/* <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
            <Globe className="size-3.5" /> Site Map
          </div> */}
          <h1 className="text-3xl font-semibold mt-2">Marketing Page Routes</h1>
          <p className="text-muted-foreground mt-2 text-sm max-w-xl">
            Every public-facing page on the Shivers website, ready to copy and share - for ads, social bios,
            QR codes, or partner listings.
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2 shrink-0">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{TOTAL_ROUTES}</span> pages live
          </div>
          <button
            onClick={handleCopyAll}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {copiedAll ? (
              <>
                <Check className="size-4" /> All Links Copied
              </>
            ) : (
              <>
                <Copy className="size-4" /> Copy All Links
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Base URL banner */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="size-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Production Domain</p>
            <p className="text-sm font-medium font-mono truncate">{SITE_URL}</p>
          </div>
        </div>
        <CopyButton text={SITE_URL} />
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="relative"
      >
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search pages by name, path, or description..."
          className="w-full h-11 pl-10 pr-4 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </motion.div>

      {/* Route groups */}
      <div className="space-y-8">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground text-sm">No pages match "{search}"</p>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <motion.div
              key={group.group}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="space-y-3"
            >
              <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium px-1">
                {group.group}
              </h2>
              <div className="space-y-2">
                {group.items.map((item, i) => (
                  <RouteRow key={item.path} item={item} index={i} />
                ))}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}