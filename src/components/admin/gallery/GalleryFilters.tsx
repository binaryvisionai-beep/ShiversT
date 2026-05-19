import { motion } from "framer-motion";

import type { GalleryFilter } from "@/types/gallery";
import { cn } from "@/lib/utils";

const FILTERS: { value: GalleryFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "food", label: "Food" },
  { value: "ambiance", label: "Ambiance" },
];

export function GalleryFilters({
  value,
  onChange,
}: {
  value: GalleryFilter;
  onChange: (v: GalleryFilter) => void;
}) {
  return (
    <motion.div
      layout
      className="flex flex-wrap items-center justify-center gap-2 sm:gap-4"
      role="tablist"
      aria-label="Gallery category"
    >
      {FILTERS.map((f) => {
        const active = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(f.value)}
            className={cn(
              "relative px-4 py-2 text-sm font-medium transition-colors rounded-full",
              active ? "text-gold" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {active && (
              <motion.span
                layoutId="gallery-filter-pill"
                className="absolute inset-0 rounded-full border border-gold/40 bg-cream/80 shadow-soft"
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
              />
            )}
            <span className="relative z-10">{f.label}</span>
          </button>
        );
      })}
    </motion.div>
  );
}
