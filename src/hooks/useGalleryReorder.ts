import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GALLERY_QUERY_KEY } from "@/hooks/useGallery";
import { reorderGalleryImages } from "@/lib/supabase/gallery";
import type { GalleryImage } from "@/types/gallery";

export function useGalleryReorder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: reorderGalleryImages,
    onMutate: async (orderedIds: string[]) => {
      await queryClient.cancelQueries({ queryKey: [GALLERY_QUERY_KEY] });
      const previous = queryClient.getQueriesData<GalleryImage[]>({
        queryKey: [GALLERY_QUERY_KEY],
      });

      queryClient.setQueriesData<GalleryImage[]>({ queryKey: [GALLERY_QUERY_KEY] }, (old) => {
        if (!old) return old;
        const map = new Map(old.map((img) => [img.id, img]));
        return orderedIds
          .map((id, index) => {
            const img = map.get(id);
            return img ? { ...img, display_order: index } : null;
          })
          .filter(Boolean) as GalleryImage[];
      });

      return { previous };
    },
    onError: (_err, _ids, context) => {
      context?.previous.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast.error("Could not save order. Please try again.");
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: [GALLERY_QUERY_KEY] });
    },
  });
}
