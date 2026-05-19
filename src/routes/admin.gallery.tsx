import { createFileRoute } from "@tanstack/react-router";

import { GalleryManager } from "@/components/admin/gallery/GalleryManager";

export const Route = createFileRoute("/admin/gallery")({
  component: GalleryManager,
});
