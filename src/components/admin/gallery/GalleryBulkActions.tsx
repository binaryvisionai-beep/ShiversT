import { Copy, Eye, EyeOff, Salad, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";

type Props = {
  selectedCount: number;
  selectedImages: GalleryImage[];
  disabled?: boolean;
  onDelete: () => void;
  onShow: () => void;
  onHide: () => void;
  onCategory: (category: GalleryCategory) => void;
  onDuplicate: () => void;
};

export function GalleryBulkActions({
  selectedCount,
  disabled,
  onDelete,
  onShow,
  onHide,
  onCategory,
  onDuplicate,
}: Props) {
  if (selectedCount === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="rounded-xl border-gold/30"
        >
          Bulk ({selectedCount})
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-xl w-48">
        <DropdownMenuItem onClick={onShow}>
          <Eye className="size-4 mr-2" /> Show selected
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onHide}>
          <EyeOff className="size-4 mr-2" /> Hide selected
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onCategory("food")}>
          <Salad className="size-4 mr-2" /> Set Food
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onCategory("ambiance")}>
          <Sparkles className="size-4 mr-2" /> Set Ambiance
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDuplicate}>
          <Copy className="size-4 mr-2" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
          <Trash2 className="size-4 mr-2" /> Delete selected
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
