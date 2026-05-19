import { useQuery, useQueryClient } from "@tanstack/react-query";

import {
  computeGalleryStats,
  fetchGalleryImages,
  type FetchGalleryOptions,
} from "@/lib/supabase/gallery";
import type { GalleryStats } from "@/types/gallery";

export const GALLERY_QUERY_KEY = "gallery";

export function galleryQueryKey(options: FetchGalleryOptions) {
  return [GALLERY_QUERY_KEY, options] as const;
}

export function useGallery(options: FetchGalleryOptions = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: galleryQueryKey({ ...options, includeHidden: true }),
    queryFn: () => fetchGalleryImages({ ...options, includeHidden: true }),
    staleTime: 30_000,
  });

  const allImagesQuery = useQuery({
    queryKey: [GALLERY_QUERY_KEY, "all-stats"],
    queryFn: () => fetchGalleryImages({ includeHidden: true }),
    staleTime: 30_000,
  });

  const stats: GalleryStats = computeGalleryStats(allImagesQuery.data ?? []);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: [GALLERY_QUERY_KEY] });
  };

  return {
    images: query.data ?? [],
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    invalidate,
  };
}
