import { useState } from "react";
import { motion } from "framer-motion";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { POSITION_PRESETS } from "@/lib/validations/gallery";
import { cn } from "@/lib/utils";

export function ImagePositionEditor({
  imageUrl,
  value,
  onChange,
}: {
  imageUrl: string;
  value: string;
  onChange: (position: string) => void;
}) {
  const [custom, setCustom] = useState(() =>
    POSITION_PRESETS.some((p) => p.value === value) ? "" : value,
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      <motion.div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-soft"
        layout
      >
        <img
          src={imageUrl}
          alt="Position preview"
          className="h-full w-full object-cover transition-[object-position] duration-300"
          style={{ objectPosition: value }}
        />
        <motion.div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/20 rounded-2xl"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        />
      </motion.div>

      <motion.div layout className="flex flex-wrap gap-2">
        {POSITION_PRESETS.map((preset) => (
          <button
            key={preset.value}
            type="button"
            onClick={() => {
              onChange(preset.value);
              setCustom("");
            }}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium border transition-colors",
              value === preset.value
                ? "border-gold/50 bg-cream text-gold"
                : "border-border bg-card text-muted-foreground hover:border-gold/30",
            )}
          >
            {preset.label}
          </button>
        ))}
      </motion.div>

      <div className="space-y-2">
        <Label
          htmlFor="custom-position"
          className="text-xs uppercase tracking-widest text-muted-foreground"
        >
          Custom position
        </Label>
        <Input
          id="custom-position"
          placeholder="e.g. 50% 20% or top center"
          value={custom}
          onChange={(e) => {
            setCustom(e.target.value);
            if (e.target.value.trim()) onChange(e.target.value.trim());
          }}
          className="rounded-xl"
        />
        <p className="text-xs text-muted-foreground">
          Current: <span className="font-mono text-foreground">{value}</span>
        </p>
      </div>
    </motion.div>
  );
}
