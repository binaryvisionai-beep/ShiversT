import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { EmptyGalleryState } from "@/components/admin/gallery/EmptyGalleryState";
import { GalleryEditDrawer } from "@/components/admin/gallery/GalleryEditDrawer";
import { GalleryReorderGrid } from "@/components/admin/gallery/GalleryReorderGrid";
import { GalleryStats } from "@/components/admin/gallery/GalleryStats";
import { GalleryToolbar } from "@/components/admin/gallery/GalleryToolbar";
import { GalleryUploadModal } from "@/components/admin/gallery/GalleryUploadModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/auth-context";
import { useBulkGalleryActions } from "@/hooks/useBulkGalleryActions";
import { useGallery } from "@/hooks/useGallery";
import { useGalleryReorder } from "@/hooks/useGalleryReorder";
import { useGalleryUpload } from "@/hooks/useGalleryUpload";
import { pageVariants } from "@/lib/animations/gallery";
import { deleteGalleryImage, updateGalleryImage } from "@/lib/supabase/gallery";
import type { GalleryFilter, GalleryImage, GallerySort } from "@/types/gallery";
import { cn } from "@/lib/utils";

type ViewMode = "grid" | "compact";

export function GalleryManager() {
  const { session } = useAuth();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<GalleryFilter>("all");
  const [sort, setSort] = useState<GallerySort>("display_order");
  const [view, setView] = useState<ViewMode>("grid");
  const [showHidden, setShowHidden] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editImage, setEditImage] = useState<GalleryImage | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GalleryImage | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const { images, stats, isLoading, isError, invalidate } = useGallery({
    category: category === "all" ? undefined : category,
    search,
    sort,
    includeHidden: true,
  });

  const filteredImages = useMemo(() => {
    if (showHidden) return images;
    return images.filter((i) => i.is_visible);
  }, [images, showHidden]);

  const { uploadOne } = useGalleryUpload(session?.userId);
  const reorderMutation = useGalleryReorder();
  const bulk = useBulkGalleryActions();

  const deleteMutation = useMutation({
    mutationFn: deleteGalleryImage,
    onSuccess: () => {
      invalidate();
      toast.success("Image removed");
      setDeleteTarget(null);
    },
    onError: () => toast.error("Could not delete image"),
  });

  const visibilityMutation = useMutation({
    mutationFn: ({ image, visible }: { image: GalleryImage; visible: boolean }) =>
      updateGalleryImage(image.id, { is_visible: visible }),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Could not update visibility"),
  });

  const selectedImages = useMemo(
    () => images.filter((i) => selectedIds.has(i.id)),
    [images, selectedIds],
  );

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleBulkDelete = () => {
    bulk.bulkDelete.mutate(selectedImages, {
      onSuccess: () => {
        setSelectedIds(new Set());
        setBulkDeleteOpen(false);
      },
    });
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-8">
      <header className="space-y-3">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Gallery</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <motion.div layout>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Content</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">Gallery</h1>
          <p className="text-muted-foreground mt-1 text-sm max-w-xl">
            Curate cinematic visuals for the public site — Food, Ambiance, and display order.
          </p>
        </motion.div>
      </header>

      <GalleryStats stats={stats} />

      <GalleryToolbar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
        sort={sort}
        onSortChange={setSort}
        view={view}
        onViewChange={setView}
        showHidden={showHidden}
        onShowHiddenChange={setShowHidden}
        onUpload={() => setUploadOpen(true)}
        selectedIds={selectedIds}
        selectedImages={selectedImages}
        bulkDisabled={bulk.isBusy}
        onBulkDelete={() => setBulkDeleteOpen(true)}
        onBulkShow={() => {
          bulk.bulkVisibility.mutate(
            { ids: [...selectedIds], is_visible: true },
            { onSuccess: () => setSelectedIds(new Set()) },
          );
        }}
        onBulkHide={() => {
          bulk.bulkVisibility.mutate(
            { ids: [...selectedIds], is_visible: false },
            { onSuccess: () => setSelectedIds(new Set()) },
          );
        }}
        onBulkCategory={(c) => {
          bulk.bulkCategory.mutate(
            { ids: [...selectedIds], category: c },
            { onSuccess: () => setSelectedIds(new Set()) },
          );
        }}
        onBulkDuplicate={() => {
          bulk.bulkDuplicate.mutate(selectedImages, {
            onSuccess: () => setSelectedIds(new Set()),
          });
        }}
      />

      {isLoading && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="mb-4 aspect-[4/5] rounded-2xl break-inside-avoid" />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm">
          Could not load gallery. Check your connection and Supabase migration.
        </div>
      )}

      {!isLoading && !isError && filteredImages.length === 0 && (
        <EmptyGalleryState onUpload={() => setUploadOpen(true)} />
      )}

      {!isLoading && !isError && filteredImages.length > 0 && view === "grid" && (
        <GalleryReorderGrid
          images={filteredImages}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onEdit={setEditImage}
          onDelete={setDeleteTarget}
          onToggleVisible={(img, visible) => visibilityMutation.mutate({ image: img, visible })}
          onReorder={(ids) => reorderMutation.mutate(ids)}
        />
      )}

      {!isLoading && !isError && filteredImages.length > 0 && view === "compact" && (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          <ul className="divide-y divide-border">
            {filteredImages.map((image) => (
              <li
                key={image.id}
                className={cn(
                  "flex items-center gap-4 p-3 hover:bg-muted/30 transition-colors",
                  !image.is_visible && "opacity-70",
                )}
              >
                <Checkbox
                  checked={selectedIds.has(image.id)}
                  onCheckedChange={(c) => toggleSelect(image.id, c === true)}
                  aria-label={`Select ${image.title ?? "image"}`}
                />
                <img
                  src={image.image_url}
                  alt=""
                  className="size-14 rounded-xl object-cover shrink-0"
                  style={{ objectPosition: image.object_position }}
                />
                <motion.div layout className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{image.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {image.category} ·{" "}
                    {formatDistanceToNow(new Date(image.created_at), { addSuffix: true })}
                  </p>
                </motion.div>
                <div className="flex items-center gap-1 shrink-0">
                  {image.is_visible ? (
                    <Eye className="size-3.5 text-muted-foreground" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted-foreground" />
                  )}
                  <Switch
                    checked={image.is_visible}
                    onCheckedChange={(v) => visibilityMutation.mutate({ image, visible: v })}
                    aria-label="Toggle visibility"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    onClick={() => setEditImage(image)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    onClick={() => setDeleteTarget(image)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <GalleryUploadModal open={uploadOpen} onOpenChange={setUploadOpen} onUpload={uploadOne} />

      <GalleryEditDrawer
        image={editImage}
        open={!!editImage}
        onOpenChange={(open) => !open && setEditImage(null)}
        onSaved={invalidate}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete image?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the image from storage and the public gallery. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">
              Delete {selectedIds.size} images?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All selected images will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Delete all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
