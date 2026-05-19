import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { EyeOff, Images, Salad, Sparkles } from "lucide-react";

import { staggerContainer, staggerItem } from "@/lib/animations/gallery";
import type { GalleryStats as Stats } from "@/types/gallery";
import { cn } from "@/lib/utils";

function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplay(0);
      return;
    }
    const duration = 600;
    const start = performance.now();
    const from = display;
    let frame: number;

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span>{display}</span>;
}

const CARDS = [
  { key: "total", label: "Total Images", icon: Images, accent: "text-primary" },
  { key: "food", label: "Food", icon: Salad, accent: "text-gold" },
  { key: "ambiance", label: "Ambiance", icon: Sparkles, accent: "text-bronze" },
  { key: "hidden", label: "Hidden", icon: EyeOff, accent: "text-muted-foreground" },
] as const;

export function GalleryStats({ stats }: { stats: Stats }) {
  const values: Record<(typeof CARDS)[number]["key"], number> = {
    total: stats.total,
    food: stats.food,
    ambiance: stats.ambiance,
    hidden: stats.hidden,
  };

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 lg:grid-cols-4 gap-3"
    >
      {CARDS.map(({ key, label, icon: Icon, accent }) => (
        <motion.div
          key={key}
          variants={staggerItem}
          className="rounded-2xl border border-border bg-card p-4 shadow-soft"
        >
          <motion.div
            className={cn("size-9 rounded-xl bg-muted/60 flex items-center justify-center", accent)}
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Icon className="size-4" />
          </motion.div>
          <p className="text-2xl font-display mt-3 tabular-nums">
            <AnimatedCount value={values[key]} />
          </p>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mt-0.5">{label}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
