import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { GALLERY_QUERY_KEY } from "@/hooks/useGallery";
import { uploadGalleryImage } from "@/lib/supabase/gallery";
import type { GalleryCategory } from "@/types/gallery";

export type PendingUpload = {
  id: string;
  file: File;
  preview: string;
  category: GalleryCategory;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

export function useGalleryUpload(uploadedBy?: string) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async ({
      file,
      category,
      title,
      alt_text,
    }: {
      file: File;
      category: GalleryCategory;
      title?: string;
      alt_text?: string;
    }) => uploadGalleryImage({ file, category, title, alt_text, uploadedBy }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [GALLERY_QUERY_KEY] });
    },
  });

  const uploadOne = async (
    file: File,
    category: GalleryCategory,
    meta?: { title?: string; alt_text?: string },
  ) => {
    try {
      await mutation.mutateAsync({ file, category, ...meta });
      toast.success("Image published");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Upload failed";
      toast.error(msg);
      throw e;
    }
  };

  return {
    uploadOne,
    isUploading: mutation.isPending,
  };
}
