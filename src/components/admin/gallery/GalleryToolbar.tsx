import { motion } from "framer-motion";
import { ImagePlus, LayoutGrid, List, Search } from "lucide-react";

import { GalleryBulkActions } from "@/components/admin/gallery/GalleryBulkActions";
import { GalleryFilters } from "@/components/admin/gallery/GalleryFilters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { GalleryCategory, GalleryFilter, GalleryImage, GallerySort } from "@/types/gallery";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "compact";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  category: GalleryFilter;
  onCategoryChange: (v: GalleryFilter) => void;
  sort: GallerySort;
  onSortChange: (v: GallerySort) => void;
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  showHidden: boolean;
  onShowHiddenChange: (v: boolean) => void;
  onUpload: () => void;
  selectedIds: Set<string>;
  selectedImages: GalleryImage[];
  bulkDisabled?: boolean;
  onBulkDelete: () => void;
  onBulkShow: () => void;
  onBulkHide: () => void;
  onBulkCategory: (c: GalleryCategory) => void;
  onBulkDuplicate: () => void;
};

export function GalleryToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  sort,
  onSortChange,
  view,
  onViewChange,
  showHidden,
  onShowHiddenChange,
  onUpload,
  selectedIds,
  selectedImages,
  bulkDisabled,
  onBulkDelete,
  onBulkShow,
  onBulkHide,
  onBulkCategory,
  onBulkDuplicate,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-20 -mx-4 px-4 py-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10 glass border-b border-border/60 space-y-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <Button
          onClick={onUpload}
          className="rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow hover:opacity-95 shrink-0"
        >
          <ImagePlus className="size-4" />
          Upload
        </Button>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or alt text…"
            className="pl-9 rounded-xl bg-card"
            aria-label="Search gallery"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={sort} onValueChange={(v) => onSortChange(v as GallerySort)}>
            <SelectTrigger className="w-[140px] rounded-xl" aria-label="Sort order">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="display_order">Display order</SelectItem>
              <SelectItem value="created_at">Date added</SelectItem>
            </SelectContent>
          </Select>

          <motion.div layout className="flex rounded-xl border border-border p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => onViewChange("grid")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "grid" ? "bg-card shadow-soft text-primary" : "text-muted-foreground",
              )}
              aria-label="Grid view"
              aria-pressed={view === "grid"}
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewChange("compact")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                view === "compact" ? "bg-card shadow-soft text-primary" : "text-muted-foreground",
              )}
              aria-label="Compact view"
              aria-pressed={view === "compact"}
            >
              <List className="size-4" />
            </button>
          </motion.div>

          <GalleryBulkActions
            selectedCount={selectedIds.size}
            selectedImages={selectedImages}
            disabled={bulkDisabled}
            onDelete={onBulkDelete}
            onShow={onBulkShow}
            onHide={onBulkHide}
            onCategory={onBulkCategory}
            onDuplicate={onBulkDuplicate}
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <GalleryFilters value={category} onChange={onCategoryChange} />
        <div className="flex items-center gap-2 justify-center sm:justify-end">
          <Switch id="show-hidden" checked={showHidden} onCheckedChange={onShowHiddenChange} />
          <Label htmlFor="show-hidden" className="text-xs text-muted-foreground cursor-pointer">
            Show hidden
          </Label>
        </div>
      </div>
    </motion.div>
  );
}
