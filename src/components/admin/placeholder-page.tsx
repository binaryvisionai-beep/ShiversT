import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Section</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">{description}</p>
        </div>
        <Button className="rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95">
          <Sparkles className="size-4" /> Create
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl border border-border bg-card p-12 shadow-soft text-center"
      >
        <div className="mx-auto size-16 rounded-2xl bg-gradient-amber flex items-center justify-center shadow-glow">
          <Sparkles className="size-7 text-primary-foreground" />
        </div>
        <h3 className="font-display text-2xl mt-5">Coming together beautifully</h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto text-sm">
          This module is designed and ready. Connect your data source to bring it to life with the same premium polish as the rest of the suite.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto">
          {["Search", "Filters", "Export", "Insights"].map((t) => (
            <div key={t} className="rounded-xl border border-border bg-muted/40 py-3 text-xs uppercase tracking-widest text-muted-foreground">
              {t}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
