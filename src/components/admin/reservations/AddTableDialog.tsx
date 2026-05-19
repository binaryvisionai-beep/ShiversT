import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
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
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ZONE_LABELS } from "@/lib/reservations/tables";
import {
  formValuesToRestaurantTable,
  restaurantTableFormSchema,
  type RestaurantTableFormValues,
} from "@/lib/validations/restaurant-table";
import type { RestaurantTable, Zone } from "@/lib/reservations/types";
import { cn } from "@/lib/utils";

const ZONES: Zone[] = ["garden", "indoor", "terrace"];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingIds: string[];
  onAdd: (table: RestaurantTable) => void;
};

export function AddTableDialog({ open, onOpenChange, existingIds, onAdd }: Props) {
  const form = useForm<RestaurantTableFormValues>({
    resolver: zodResolver(restaurantTableFormSchema),
    defaultValues: {
      name: "",
      zone: "garden",
      seats: 2,
      premium: false,
      details: "",
    },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset();
    onOpenChange(next);
  };

  const onSubmit = (values: RestaurantTableFormValues) => {
    const table = formValuesToRestaurantTable(values, existingIds);
    onAdd(table);
    toast.success(`Table "${table.name}" added`);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "max-w-lg gap-0 border-border p-0 overflow-hidden rounded-2xl shadow-lift",
          "max-h-[min(90dvh,36rem)] flex flex-col",
        )}
      >
        <DialogHeader className="shrink-0 space-y-2 border-b border-border px-6 py-5 text-center sm:text-left">
          <DialogTitle className="font-display text-xl">Add table</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Add a table to the floor map. It appears immediately for this session.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="px-6 py-5">
            <Form {...form}>
              <form
                id="add-table-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="mx-auto w-full max-w-sm space-y-5"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Table name</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g. Garden 4"
                          className="h-11 w-full rounded-xl"
                          autoComplete="off"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Zone</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 w-full rounded-xl">
                            <SelectValue placeholder="Select zone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="z-[200] rounded-xl">
                          {ZONES.map((z) => (
                            <SelectItem key={z} value={z}>
                              {ZONE_LABELS[z]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seats"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Seats</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          className="h-11 w-full rounded-xl"
                          value={field.value}
                          onChange={(e) => field.onChange(e.target.valueAsNumber || 1)}
                          onBlur={field.onBlur}
                          name={field.name}
                          ref={field.ref}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Details (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          value={field.value ?? ""}
                          placeholder="Location notes, VIP, window seat…"
                          className="min-h-[88px] w-full resize-none rounded-xl"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="premium"
                  render={({ field }) => (
                    <FormItem className="flex w-full items-center justify-between gap-4 rounded-xl border border-border px-4 py-3.5">
                      <FormLabel className="!mt-0 text-left">Premium table</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </form>
            </Form>
          </div>
        </ScrollArea>

        <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border bg-muted/20 px-6 py-4 sm:flex-row sm:justify-center">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full rounded-xl sm:min-w-[7.5rem] sm:w-auto"
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="add-table-form"
            disabled={form.formState.isSubmitting}
            className="h-11 w-full rounded-xl border-0 bg-gradient-amber text-primary-foreground shadow-glow sm:min-w-[9rem] sm:w-auto"
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Adding…
              </>
            ) : (
              <>
                <Plus className="size-4" /> Add table
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
