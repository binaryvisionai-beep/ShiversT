import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { Eye, EyeOff, GripVertical, Pencil, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { overlayVariants } from "@/lib/animations/gallery";
import type { GalleryImage } from "@/types/gallery";
import { cn } from "@/lib/utils";

type Props = {
  image: GalleryImage;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onEdit: (image: GalleryImage) => void;
  onDelete: (image: GalleryImage) => void;
  onToggleVisible: (image: GalleryImage, visible: boolean) => void;
  sortable?: boolean;
};

function GalleryImageCardInner({
  image,
  selected,
  onSelect,
  onEdit,
  onDelete,
  onToggleVisible,
  sortable = true,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
    disabled: !sortable,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.article
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: isDragging ? 0.5 : 1, y: 0 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "group relative break-inside-avoid mb-4 rounded-2xl border border-border bg-card overflow-hidden shadow-soft",
        isDragging && "z-50 shadow-lift ring-2 ring-gold/30",
        !image.is_visible && "opacity-75",
      )}
    >
      <motion.div className="relative aspect-[4/5] overflow-hidden bg-muted">
        <img
          src={image.image_url}
          alt={image.alt_text ?? image.title ?? "Gallery image"}
          className="h-full w-full object-cover transition-[object-position] duration-300"
          style={{ objectPosition: image.object_position }}
          loading="lazy"
        />

        <motion.div
          variants={overlayVariants}
          initial="rest"
          whileHover="hover"
          className="absolute inset-0 bg-gradient-to-t from-coffee/80 via-coffee/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 gap-2"
        >
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              className="size-8 rounded-lg bg-card/90"
              onClick={() => onEdit(image)}
              aria-label="Edit image"
            >
              <Pencil className="size-3.5" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              className="size-8 rounded-lg bg-card/90 text-destructive"
              onClick={() => onDelete(image)}
              aria-label="Delete image"
            >
              <Trash2 className="size-3.5" />
            </Button>
            {sortable && (
              <button
                type="button"
                className="ml-auto flex size-8 items-center justify-center rounded-lg bg-card/90 cursor-grab active:cursor-grabbing"
                aria-label="Drag to reorder"
                {...attributes}
                {...listeners}
              >
                <GripVertical className="size-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="absolute top-3 left-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(c) => onSelect(image.id, c === true)}
            className="border-border bg-card/90 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            aria-label={`Select ${image.title ?? "image"}`}
          />
        </motion.div>
      </motion.div>

      <div className="p-3 space-y-2">
        <motion.div layout className="flex items-center justify-between gap-2">
          <Badge
            variant="outline"
            className={cn(
              "rounded-full text-[10px] uppercase tracking-wider",
              image.category === "food"
                ? "border-gold/40 text-gold bg-gold/10"
                : "border-bronze/40 text-bronze bg-bronze/10",
            )}
          >
            {image.category}
          </Badge>
          <div className="flex items-center gap-1.5">
            {image.is_visible ? (
              <Eye className="size-3.5 text-muted-foreground" aria-hidden />
            ) : (
              <EyeOff className="size-3.5 text-muted-foreground" aria-hidden />
            )}
            <Switch
              checked={image.is_visible}
              onCheckedChange={(v) => onToggleVisible(image, v)}
              aria-label={image.is_visible ? "Hide image" : "Show image"}
            />
          </div>
        </motion.div>
        <p className="text-sm font-medium truncate">{image.title || "Untitled"}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
        </p>
      </div>
    </motion.article>
  );
}

export const GalleryImageCard = memo(GalleryImageCardInner);
