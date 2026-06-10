import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CircleHelp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
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

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
};

const emptyForm = {
  question: "",
  answer: "",
  display_order: 0,
  is_active: true,
};

export default function FAQPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FaqItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("room_faqs")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }
      setItems(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, display_order: items.length });
    setModalOpen(true);
  };

  const openEdit = (item: FaqItem) => {
    setEditing(item);
    setForm({
      question: item.question,
      answer: item.answer,
      display_order: item.display_order,
      is_active: item.is_active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const saveItem = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      alert("Question and answer are required");
      return;
    }

    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      display_order: form.display_order,
      is_active: form.is_active,
    };

    try {
      setSaving(true);
      setMessage("");

      if (editing) {
        const { error } = await supabase
          .from("room_faqs")
          .update(payload)
          .eq("id", editing.id);

        if (error) {
          console.error(error);
          alert("Failed to update FAQ");
          return;
        }
        setMessage("FAQ updated");
      } else {
        const { error } = await supabase.from("room_faqs").insert(payload);

        if (error) {
          console.error(error);
          alert("Failed to add FAQ");
          return;
        }
        setMessage("FAQ added");
      }

      closeModal();
      loadItems();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      const { error } = await supabase
        .from("room_faqs")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        console.error(error);
        alert("Failed to delete FAQ");
        return;
      }

      setDeleteTarget(null);
      loadItems();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Content</p>
          <h1 className="font-display text-3xl md:text-4xl mt-1">FAQ</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Manage the Frequently Asked Questions shown on the Luxury Rooms page.
          </p>
        </div>
        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      <section className="rounded-3xl border bg-background p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Questions &amp; Answers</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add, edit, or remove FAQ entries. Active items appear on the website.
            </p>
          </div>
          <Button onClick={openCreate} className="rounded-2xl h-11 px-5">
            <Plus className="size-4" />
            Add FAQ
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading FAQs...
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-muted/20 p-10 text-center space-y-3">
            <CircleHelp className="size-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No FAQ entries yet.</p>
            <p className="text-xs text-muted-foreground">
              Run <code className="font-mono">supabase/run_room_faqs_setup.sql</code> in the Supabase SQL Editor to seed the existing website FAQs.
            </p>
            <Button onClick={openCreate} variant="outline" className="rounded-2xl">
              <Plus className="size-4" />
              Add your first FAQ
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border bg-muted/10 p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{item.question}</h3>
                    {!item.is_active && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.answer}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl"
                    onClick={() => openEdit(item)}
                    aria-label="Edit FAQ"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-xl text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Delete FAQ"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-coffee/40 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border bg-background p-6 space-y-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit FAQ" : "Add FAQ"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="size-9 rounded-xl hover:bg-accent flex items-center justify-center"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Question</label>
                <input
                  type="text"
                  value={form.question}
                  onChange={(e) => setForm({ ...form, question: e.target.value })}
                  className="w-full h-12 rounded-2xl border px-4 bg-background"
                  placeholder="What are your check-in times?"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Answer</label>
                <textarea
                  value={form.answer}
                  onChange={(e) => setForm({ ...form, answer: e.target.value })}
                  rows={5}
                  className="w-full rounded-2xl border px-4 py-3 bg-background resize-y"
                  placeholder="Check-in is from 2:00 PM..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display order</label>
                  <input
                    type="number"
                    min={0}
                    value={form.display_order}
                    onChange={(e) =>
                      setForm({ ...form, display_order: Number(e.target.value) || 0 })
                    }
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select
                    value={form.is_active ? "active" : "inactive"}
                    onChange={(e) =>
                      setForm({ ...form, is_active: e.target.value === "active" })
                    }
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={closeModal} className="rounded-2xl">
                Cancel
              </Button>
              <Button onClick={saveItem} disabled={saving} className="rounded-2xl">
                {saving && <Loader2 className="size-4 animate-spin" />}
                {saving ? "Saving..." : editing ? "Save changes" : "Add FAQ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove &quot;{deleteTarget?.question}&quot;.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteItem}
              disabled={deleting}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
