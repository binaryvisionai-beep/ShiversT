import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { GALLERY_QUERY_KEY } from "@/hooks/useGallery";
import {
  bulkDeleteGalleryImages,
  bulkUpdateGalleryImages,
  duplicateGalleryImage,
} from "@/lib/supabase/gallery";
import type { GalleryCategory, GalleryImage } from "@/types/gallery";

export function useBulkGalleryActions() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: [GALLERY_QUERY_KEY] });

  const bulkDelete = useMutation({
    mutationFn: (images: GalleryImage[]) => bulkDeleteGalleryImages(images),
    onSuccess: () => {
      invalidate();
      toast.success("Selected images deleted");
    },
    onError: () => toast.error("Failed to delete selected images"),
  });

  const bulkVisibility = useMutation({
    mutationFn: ({ ids, is_visible }: { ids: string[]; is_visible: boolean }) =>
      bulkUpdateGalleryImages(ids, { is_visible }),
    onSuccess: (_d, { is_visible }) => {
      invalidate();
      toast.success(is_visible ? "Images are now visible" : "Images hidden");
    },
    onError: () => toast.error("Bulk update failed"),
  });

  const bulkCategory = useMutation({
    mutationFn: ({ ids, category }: { ids: string[]; category: GalleryCategory }) =>
      bulkUpdateGalleryImages(ids, { category }),
    onSuccess: () => {
      invalidate();
      toast.success("Category updated");
    },
    onError: () => toast.error("Failed to change category"),
  });

  const bulkDuplicate = useMutation({
    mutationFn: async (images: GalleryImage[]) => {
      for (const img of images) {
        await duplicateGalleryImage(img, session?.userId);
      }
    },
    onSuccess: () => {
      invalidate();
      toast.success("Images duplicated");
    },
    onError: () => toast.error("Duplication failed"),
  });

  return {
    bulkDelete,
    bulkVisibility,
    bulkCategory,
    bulkDuplicate,
    isBusy:
      bulkDelete.isPending ||
      bulkVisibility.isPending ||
      bulkCategory.isPending ||
      bulkDuplicate.isPending,
  };
}
