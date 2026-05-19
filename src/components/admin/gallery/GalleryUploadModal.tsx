import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { modalVariants } from "@/lib/animations/gallery";
import { uploadFileSchema } from "@/lib/validations/gallery";
import type { GalleryCategory } from "@/types/gallery";
import { cn } from "@/lib/utils";

type FileItem = {
  id: string;
  file: File;
  preview: string;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, category: GalleryCategory) => Promise<void>;
  defaultCategory?: GalleryCategory;
};

export function GalleryUploadModal({
  open,
  onOpenChange,
  onUpload,
  defaultCategory = "ambiance",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<GalleryCategory>(defaultCategory);
  const [items, setItems] = useState<FileItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const next: FileItem[] = [];
      Array.from(files).forEach((file) => {
        const parsed = uploadFileSchema.safeParse({ file, category });
        if (!parsed.success) {
          toast.error(parsed.error.errors[0]?.message ?? "Invalid file");
          return;
        }
        next.push({
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
          status: "pending",
        });
      });
      setItems((prev) => [...prev, ...next]);
    },
    [category],
  );

  const removeItem = (id: string) => {
    setItems((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handlePublish = async () => {
    if (items.length === 0) return;
    setIsPublishing(true);
    let done = 0;

    for (const item of items) {
      if (item.status === "done") {
        done++;
        continue;
      }
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "uploading" } : i)));
      try {
        await onUpload(item.file, category);
        done++;
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, status: "done" } : i)));
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: "error",
                  error: e instanceof Error ? e.message : "Upload failed",
                }
              : i,
          ),
        );
      }
    }

    setIsPublishing(false);
    if (done === items.length) {
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setItems([]);
      onOpenChange(false);
    }
  };

  const progress =
    items.length === 0
      ? 0
      : Math.round((items.filter((i) => i.status === "done").length / items.length) * 100);

  const handleClose = (next: boolean) => {
    if (!next) {
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setItems([]);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl rounded-2xl border-border p-0 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key="upload-modal"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <DialogHeader className="p-6 pb-2">
              <DialogTitle className="font-display text-2xl">Upload visuals</DialogTitle>
              <DialogDescription>
                Drop luxury photography. Images are compressed and optimized automatically.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4">
              <motion.div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  "rounded-2xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
                  dragOver
                    ? "border-gold/50 bg-cream/50"
                    : "border-border bg-muted/30 hover:border-gold/30",
                )}
              >
                <Upload className="size-8 mx-auto text-gold mb-3" />
                <p className="text-sm font-medium">Drag & drop or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP up to 8MB</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </motion.div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Category
                </Label>
                <Select value={category} onValueChange={(v) => setCategory(v as GalleryCategory)}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food</SelectItem>
                    <SelectItem value="ambiance">Ambiance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isPublishing && items.length > 0 && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                </div>
              )}

              {items.length > 0 && (
                <motion.div
                  layout
                  className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1"
                >
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      layout
                      className="relative aspect-square rounded-xl overflow-hidden border border-border group"
                    >
                      <img src={item.preview} alt="" className="h-full w-full object-cover" />
                      {item.status === "uploading" && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <Loader2 className="size-5 animate-spin text-primary" />
                        </div>
                      )}
                      {item.status === "done" && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <ImagePlus className="size-5 text-primary" />
                        </div>
                      )}
                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          className="absolute top-1 right-1 size-6 rounded-full bg-card/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Remove"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {isPublishing && items.length === 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="aspect-square rounded-xl" />
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="p-6 pt-4 gap-2 sm:gap-0">
              <Button variant="outline" className="rounded-xl" onClick={() => handleClose(false)}>
                Cancel
              </Button>
              <Button
                className="rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow"
                disabled={items.length === 0 || isPublishing}
                onClick={() => void handlePublish()}
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Publishing…
                  </>
                ) : (
                  <>Publish {items.length > 0 ? `(${items.length})` : ""}</>
                )}
              </Button>
            </DialogFooter>
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
