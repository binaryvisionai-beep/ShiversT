import { useCallback, useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/ui/input";
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
  onUpload: (file: File, category: string) => Promise<void>;
  /** Existing DB categories so admin can pick them; new ones can also be typed */
  existingCategories?: string[];
  defaultCategory?: string;
};

export function GalleryUploadModal({
  open,
  onOpenChange,
  onUpload,
  existingCategories = ["food", "ambiance"],
  defaultCategory = "ambiance",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState<string>(defaultCategory);
  const [customCategory, setCustomCategory] = useState("");
  const [items, setItems] = useState<FileItem[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      items.forEach((i) => URL.revokeObjectURL(i.preview));
      setItems([]);
      setCustomCategory("");
      setCategory(defaultCategory);
    }
  }, [open]);

  const effectiveCategory = customCategory.trim() || category;

  // const addFiles = useCallback(
  //   (files: FileList | File[]) => {
  //     const next: FileItem[] = [];
  //     Array.from(files).forEach((file) => {
        // Basic size check (8 MB)
        // if (file.size > 8 * 1024 * 1024) {
        //   toast.error(`${file.name} exceeds 8 MB`);
        //   return;
  //       if (!file.type.startsWith("image/")) {
  // toast.error(`${file.name} is not an image`);
  // return;
// }
        // }
        // if (!file.type.startsWith("image/")) {
        //   toast.error(`${file.name} is not an image`);
        //   return;
        // }
        // next.push({
        //   id: crypto.randomUUID(),
        //   file,
  //         preview: URL.createObjectURL(file),
  //         status: "pending",
  //       });
  //     });
  //     setItems((prev) => [...prev, ...next]);
  //   },
  //   [],
  // );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const next: FileItem[] = [];
      Array.from(files).forEach((file) => {
        if (!file.type.startsWith("image/")) {
          toast.error(`${file.name} is not an image`);
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
    [],
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
      if (item.status === "done") { done++; continue; }
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "uploading" } : i));
      try {
        await onUpload(item.file, effectiveCategory);
        done++;
        setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, status: "done" } : i));
      } catch (e) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? { ...i, status: "error", error: e instanceof Error ? e.message : "Upload failed" }
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

  // All known categories = existing + any newly typed custom one
  const allCategories = Array.from(new Set([...existingCategories]));

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
              <DialogTitle className="font-display text-2xl">Upload images</DialogTitle>
              <DialogDescription>
                Drop photography. Images render at their natural size on the public gallery.
              </DialogDescription>
            </DialogHeader>

            <div className="px-6 space-y-4">
              {/* Drop zone */}
              <motion.div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
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
                {/* <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP up to 8 MB</p> */}
                <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP</p>

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

              {/* Category — pick existing or type a new one */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={customCategory ? "__custom__" : category}
                  onValueChange={(v) => {
                    if (v === "__custom__") return;
                    setCategory(v);
                    setCustomCategory("");
                  }}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {allCategories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                    <SelectItem value="__custom__">+ New category…</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Type new category name (e.g. drinks)"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="rounded-xl"
                />
                {customCategory.trim() && (
                  <p className="text-xs text-muted-foreground">
                    New category: <span className="font-medium text-foreground">{customCategory.trim()}</span>
                    {" "}— will appear in the public site filter automatically.
                  </p>
                )}
              </div>

              {/* Upload progress */}
              {isPublishing && items.length > 0 && (
                <div className="space-y-1">
                  <Progress value={progress} className="h-1.5" />
                  <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                </div>
              )}

              {/* Preview grid */}
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
                      {item.status === "error" && (
                        <div className="absolute inset-0 bg-destructive/20 flex items-center justify-center">
                          <X className="size-5 text-destructive" />
                        </div>
                      )}
                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
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
                  <><Loader2 className="size-4 animate-spin" /> Publishing…</>
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