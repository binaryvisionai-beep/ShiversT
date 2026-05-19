import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { ImagePositionEditor } from "@/components/admin/gallery/ImagePositionEditor";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { galleryImageFormSchema, type GalleryImageFormValues } from "@/lib/validations/gallery";
import { updateGalleryImage } from "@/lib/supabase/gallery";
import type { GalleryImage } from "@/types/gallery";

type Props = {
  image: GalleryImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function GalleryEditDrawer({ image, open, onOpenChange, onSaved }: Props) {
  const form = useForm<GalleryImageFormValues>({
    resolver: zodResolver(galleryImageFormSchema),
    defaultValues: {
      title: "",
      alt_text: "",
      category: "ambiance",
      object_position: "center center",
      is_visible: true,
    },
  });

  useEffect(() => {
    if (image) {
      form.reset({
        title: image.title ?? "",
        alt_text: image.alt_text ?? "",
        category: image.category,
        object_position: image.object_position,
        is_visible: image.is_visible,
      });
    }
  }, [image, form]);

  const onSubmit = async (values: GalleryImageFormValues) => {
    if (!image) return;
    try {
      await updateGalleryImage(image.id, {
        title: values.title || null,
        alt_text: values.alt_text || null,
        category: values.category,
        object_position: values.object_position,
        is_visible: values.is_visible,
      });
      toast.success("Image updated");
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    }
  };

  const position = form.watch("object_position");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto scrollbar-thin">
        <SheetHeader>
          <SheetTitle className="font-display text-xl">Edit image</SheetTitle>
          <SheetDescription>Refine metadata and cinematic crop focus.</SheetDescription>
        </SheetHeader>

        {image && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-6">
              <ImagePositionEditor
                imageUrl={image.image_url}
                value={position}
                onChange={(v) => form.setValue("object_position", v, { shouldDirty: true })}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="alt_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alt text</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="food">Food</SelectItem>
                        <SelectItem value="ambiance">Ambiance</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-xl border border-border p-4">
                    <FormLabel className="!mt-0">Visible on public site</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="w-full rounded-xl bg-gradient-amber border-0 text-primary-foreground shadow-glow"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </form>
          </Form>
        )}
      </SheetContent>
    </Sheet>
  );
}
