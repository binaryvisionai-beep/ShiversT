import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatTimeSlot, normalizeTimeSlot } from "@/lib/reservations/time-slots";

const formSchema = z.object({
  time: z
    .string()
    .min(1, "Select a time")
    .refine((v) => normalizeTimeSlot(v) !== null, "Enter a valid time"),
});

type FormValues = z.infer<typeof formSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingSlots: string[];
  onAdd: (slot: string) => void;
};

export function AddTimeDialog({ open, onOpenChange, existingSlots, onAdd }: Props) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { time: "19:00" },
  });

  const handleOpenChange = (next: boolean) => {
    if (!next) form.reset({ time: "19:00" });
    onOpenChange(next);
  };

  const onSubmit = (values: FormValues) => {
    const slot = normalizeTimeSlot(values.time);
    if (!slot) return;
    if (existingSlots.includes(slot)) {
      toast.error(`${formatTimeSlot(slot)} is already on the floor plan`);
      return;
    }
    onAdd(slot);
    toast.success(`Added ${formatTimeSlot(slot)}`);
    form.reset({ time: "19:00" });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm gap-0 rounded-2xl border-border p-0 overflow-hidden">
        <DialogHeader className="border-b border-border px-6 py-5 text-left">
          <DialogTitle className="font-display text-xl">Add time slot</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Add a service time to the floor plan. It appears immediately for this session.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 px-6 py-5">
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Time</FormLabel>
                  <FormControl>
                    <Input
                      type="time"
                      step={1800}
                      className="h-11 rounded-xl"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-xl"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="h-11 rounded-xl border-0 bg-gradient-amber text-primary-foreground shadow-glow"
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Adding…
                  </>
                ) : (
                  <>
                    <Plus className="size-4" /> Add time
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
