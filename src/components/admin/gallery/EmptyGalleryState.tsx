import { motion } from "framer-motion";
import { ImagePlus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyGalleryState({ onUpload }: { onUpload: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-2xl border border-dashed border-gold/30 bg-cream/30 p-12 md:p-16 text-center"
    >
      <motion.div
        className="mx-auto size-16 rounded-2xl bg-gradient-amber flex items-center justify-center shadow-glow"
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Sparkles className="size-7 text-primary-foreground" />
      </motion.div>
      <h3 className="font-display text-2xl mt-6">Your gallery awaits</h3>
      <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm leading-relaxed">
        Upload cinematic visuals for Food and Ambiance. Drag to reorder, refine crop focus, and
        publish without touching code.
      </p>
      <Button
        onClick={onUpload}
        className="mt-8 rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95"
      >
        <ImagePlus className="size-4" />
        Upload images
      </Button>
    </motion.div>
  );
}
