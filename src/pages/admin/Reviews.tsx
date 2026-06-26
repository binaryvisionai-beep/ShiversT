import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  Star,
  Trash2,
  X,
  Pencil,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { REVIEW_SECTIONS, REVIEW_SETTINGS_IDS, DEFAULT_GOOGLE_MAP_URLS, type ReviewSection } from "@/lib/review-sections";
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

type GoogleSettings = {
  id: string;
  section: ReviewSection;
  section_heading: string;
  average_rating: number;
  review_count_label: string;
  google_profile_url: string | null;
  updated_at: string;
};

type WebsiteReview = {
  id: string;
  guest_name: string;
  rating: number;
  comment: string;
  section: ReviewSection;
  created_at: string;
};

function defaultGoogleSettingsFor(section: ReviewSection): GoogleSettings {
  return {
    id: REVIEW_SETTINGS_IDS[section],
    section,
    section_heading: "What Our Guests Say",
    average_rating: section === "restaurant" ? 4.7 : 5,
    review_count_label: section === "restaurant" ? "Based on 1000+ reviews" : "",
    google_profile_url: DEFAULT_GOOGLE_MAP_URLS[section],
    updated_at: new Date().toISOString(),
  };
}

function emptyGoogleBySection(): Record<ReviewSection, GoogleSettings> {
  return {
    restaurant: defaultGoogleSettingsFor("restaurant"),
    rooms: defaultGoogleSettingsFor("rooms"),
    tiffin: defaultGoogleSettingsFor("tiffin"),
  };
}

const emptyReviewForm = {
  guest_name: "",
  rating: 5,
  comment: "",
  section: "restaurant" as ReviewSection,
};

function StarRating({ value, size = "sm" }: { value: number; size?: "sm" | "lg" }) {
  const iconClass = size === "lg" ? "size-6" : "size-4";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = value >= i;
        const partial = !filled && value > i - 1;
        return (
          <Star
            key={i}
            className={`${iconClass} ${
              filled || partial
                ? "fill-amber-600 text-amber-600"
                : "fill-muted text-muted-foreground/30"
            }`}
            style={
              partial
                ? {
                    clipPath: `inset(0 ${100 - (value - (i - 1)) * 100}% 0 0)`,
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

function sectionLabel(section: ReviewSection): string {
  return REVIEW_SECTIONS.find((s) => s.id === section)?.label ?? section;
}

export default function ReviewsPage() {
  const [activeSection, setActiveSection] = useState<ReviewSection>("restaurant");
  const [googleBySection, setGoogleBySection] = useState(emptyGoogleBySection);
  const [reviews, setReviews] = useState<WebsiteReview[]>([]);
  const [loadingGoogle, setLoadingGoogle] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [savingGoogle, setSavingGoogle] = useState(false);
  const [googleMessage, setGoogleMessage] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<WebsiteReview | null>(null);
  const [reviewForm, setReviewForm] = useState(emptyReviewForm);
  const [savingReview, setSavingReview] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteReview | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadGoogleSettings();
    loadReviews();
  }, []);

  const sectionReviews = useMemo(
    () => reviews.filter((review) => review.section === activeSection),
    [reviews, activeSection],
  );

  const activeGoogleSettings = googleBySection[activeSection];

  const loadGoogleSettings = async () => {
    try {
      const { data, error } = await supabase.from("google_review_settings").select("*");

      if (error) {
        console.error(error);
        return;
      }

      if (data?.length) {
        setGoogleBySection((prev) => {
          const next = { ...prev };
          for (const row of data) {
            const section = (row.section || "restaurant") as ReviewSection;
            if (!REVIEW_SECTIONS.some((s) => s.id === section)) continue;
            next[section] = {
              id: row.id,
              section,
              section_heading: row.section_heading ?? next[section].section_heading,
              average_rating: Number(row.average_rating ?? next[section].average_rating),
              review_count_label: row.review_count_label ?? next[section].review_count_label,
              google_profile_url: row.google_profile_url ?? next[section].google_profile_url,
              updated_at: row.updated_at ?? next[section].updated_at,
            };
          }
          return next;
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingGoogle(false);
    }
  };

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("website_reviews")
        .select("id, guest_name, rating, comment, section, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }
      setReviews(
        ((data as WebsiteReview[]) || []).map((review) => ({
          ...review,
          section: (review.section || "restaurant") as ReviewSection,
        })),
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleGoogleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setGoogleBySection((prev) => ({
      ...prev,
      [activeSection]: {
        ...prev[activeSection],
        [name]: name === "average_rating" ? parseFloat(value) || 0 : value,
      },
    }));
  };

  const saveGoogleSettings = async () => {
    const googleSettings = googleBySection[activeSection];
    try {
      setSavingGoogle(true);
      setGoogleMessage("");

      const { error } = await supabase.from("google_review_settings").upsert({
        id: googleSettings.id,
        section: activeSection,
        section_heading: googleSettings.section_heading,
        average_rating: Math.min(5, Math.max(0, googleSettings.average_rating)),
        review_count_label: googleSettings.review_count_label,
        google_profile_url: googleSettings.google_profile_url || null,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        console.error(error);
        alert("Failed to save Google review settings");
        return;
      }

      setGoogleMessage("Saved successfully");
      loadGoogleSettings();
      setTimeout(() => setGoogleMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingGoogle(false);
    }
  };

  const closeReviewModal = () => {
    setReviewModalOpen(false);
    setEditingReview(null);
    setReviewForm({ ...emptyReviewForm, section: activeSection });
  };

  const openAddReview = () => {
    setEditingReview(null);
    setReviewForm({ ...emptyReviewForm, section: activeSection });
    setReviewModalOpen(true);
  };

  const openEditReview = (review: WebsiteReview) => {
    setEditingReview(review);
    setReviewForm({
      guest_name: review.guest_name,
      rating: review.rating,
      comment: review.comment,
      section: review.section,
    });
    setReviewModalOpen(true);
  };

  const saveReview = async () => {
    if (!reviewForm.guest_name.trim() || !reviewForm.comment.trim()) {
      alert("Name and comment are required");
      return;
    }

    const payload = {
      guest_name: reviewForm.guest_name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
      section: reviewForm.section,
      status: "approved" as const,
    };

    try {
      setSavingReview(true);
      setReviewMessage("");

      if (editingReview) {
        const { error } = await supabase
          .from("website_reviews")
          .update(payload)
          .eq("id", editingReview.id);

        if (error) {
          console.error(error);
          alert(error.message || "Failed to update review");
          return;
        }
        setReviewMessage("Review updated");
      } else {
        const { error } = await supabase.from("website_reviews").insert(payload);

        if (error) {
          console.error(error);
          alert(error.message || "Failed to add review");
          return;
        }
        setReviewMessage("Review added");
      }

      closeReviewModal();
      loadReviews();
      setTimeout(() => setReviewMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSavingReview(false);
    }
  };

  const deleteReview = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      const { error } = await supabase
        .from("website_reviews")
        .delete()
        .eq("id", deleteTarget.id);

      if (error) {
        console.error(error);
        alert("Failed to delete review");
        return;
      }
      setDeleteTarget(null);
      loadReviews();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Content</p>
        <h1 className="font-display text-3xl md:text-4xl mt-1">Reviews</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Manage testimonials separately for Restaurant, Rooms Oasis, and Northeast Tiffin Box.
          Each section publishes on its own page on the main site.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {REVIEW_SECTIONS.map((section) => {
          const count = reviews.filter((r) => r.section === section.id).length;
          const active = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-2xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-background hover:bg-muted"
              }`}
            >
              {section.label}
              <span className="ml-2 text-xs opacity-80">({count})</span>
            </button>
          );
        })}
      </div>

      {activeSection === "restaurant" && (
        <section className="rounded-3xl border bg-background p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Google Review Summary</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Used on the Restaurant page and homepage testimonials block.
              </p>
            </div>
            {googleMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> {googleMessage}
              </div>
            )}
          </div>

          {loadingGoogle ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading settings...
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section heading</label>
                  <input
                    type="text"
                    name="section_heading"
                    value={activeGoogleSettings.section_heading}
                    onChange={handleGoogleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Average rating (0–5)</label>
                  <input
                    type="number"
                    name="average_rating"
                    min={0}
                    max={5}
                    step={0.1}
                    value={activeGoogleSettings.average_rating}
                    onChange={handleGoogleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Review count label</label>
                  <input
                    type="text"
                    name="review_count_label"
                    value={activeGoogleSettings.review_count_label}
                    onChange={handleGoogleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                    placeholder="Based on 1000+ reviews"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Google Maps link</label>
                  <input
                    type="url"
                    name="google_profile_url"
                    value={activeGoogleSettings.google_profile_url || ""}
                    onChange={handleGoogleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                    placeholder="https://maps.app.goo.gl/..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Restaurant page and homepage — &quot;View on Google&quot; link.
                  </p>
                </div>
                <Button
                  onClick={saveGoogleSettings}
                  disabled={savingGoogle}
                  className="rounded-2xl h-12 px-6"
                >
                  {savingGoogle && <Loader2 className="size-4 animate-spin" />}
                  {savingGoogle ? "Saving..." : "Save Google summary"}
                </Button>
              </div>

              <div className="rounded-2xl border bg-muted/20 p-6 space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                  Live preview
                </p>
                <p className="text-sm text-muted-foreground">{activeGoogleSettings.section_heading}</p>
                <p className="text-2xl font-semibold">
                  <span className="text-amber-700">G</span>
                  <span>oogle</span>
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-semibold tabular-nums">
                    {activeGoogleSettings.average_rating.toFixed(1)}
                  </span>
                  <StarRating value={activeGoogleSettings.average_rating} size="lg" />
                </div>
                <p className="text-sm text-muted-foreground">{activeGoogleSettings.review_count_label}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {(activeSection === "rooms" || activeSection === "tiffin") && (
        <section className="rounded-3xl border bg-background p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Google Maps link</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Used for &quot;View on Google Maps&quot; on the{" "}
                {activeSection === "rooms" ? "Rooms" : "Tiffin Box"} page testimonials block.
              </p>
            </div>
            {googleMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> {googleMessage}
              </div>
            )}
          </div>

          {loadingGoogle ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Loading settings...
            </div>
          ) : (
            <div className="space-y-4 max-w-xl">
              <div className="space-y-2">
                <label className="text-sm font-medium">Google Maps URL</label>
                <input
                  type="url"
                  name="google_profile_url"
                  value={activeGoogleSettings.google_profile_url || ""}
                  onChange={handleGoogleChange}
                  className="w-full h-12 rounded-2xl border px-4 bg-background"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>
              <Button
                onClick={saveGoogleSettings}
                disabled={savingGoogle}
                className="rounded-2xl h-12 px-6"
              >
                {savingGoogle && <Loader2 className="size-4 animate-spin" />}
                {savingGoogle ? "Saving..." : "Save Maps link"}
              </Button>
            </div>
          )}
        </section>
      )}

      <section className="rounded-3xl border bg-background p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">{sectionLabel(activeSection)} testimonials</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These appear before the footer on the{" "}
              {activeSection === "restaurant"
                ? "Restaurant (and homepage)"
                : activeSection === "rooms"
                  ? "Rooms"
                  : "Tiffin Box"}{" "}
              page on the main site.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {reviewMessage && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="size-4" /> {reviewMessage}
              </div>
            )}
            <Button onClick={openAddReview} className="rounded-2xl h-11 gap-2">
              <Plus className="size-4" />
              Add review
            </Button>
          </div>
        </div>

        {loadingReviews ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading reviews...
          </div>
        ) : sectionReviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center border rounded-2xl border-dashed">
            No reviews for {sectionLabel(activeSection)} yet. Click Add review to paste your first
            testimonial.
          </p>
        ) : (
          <div className="space-y-4">
            {sectionReviews.map((review) => (
              <div
                key={review.id}
                className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-start gap-4 justify-between"
              >
                <div className="space-y-2 flex-1 min-w-0">
                  <p className="font-semibold">{review.guest_name}</p>
                  <StarRating value={review.rating} />
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {review.comment}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1"
                    onClick={() => openEditReview(review)}
                  >
                    <Pencil className="size-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl gap-1 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(review)}
                  >
                    <Trash2 className="size-3.5" />
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-lg rounded-3xl bg-background border max-h-[94vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                {editingReview ? "Edit review" : "Add review"}
              </h2>
              <button
                type="button"
                onClick={closeReviewModal}
                className="size-11 rounded-2xl border flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Section</label>
                <select
                  value={reviewForm.section}
                  onChange={(e) =>
                    setReviewForm((f) => ({
                      ...f,
                      section: e.target.value as ReviewSection,
                    }))
                  }
                  className="w-full h-12 rounded-2xl border px-4 bg-background"
                >
                  {REVIEW_SECTIONS.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Guest name</label>
                <input
                  type="text"
                  value={reviewForm.guest_name}
                  onChange={(e) => setReviewForm((f) => ({ ...f, guest_name: e.target.value }))}
                  className="w-full h-12 rounded-2xl border px-4 bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                      className="p-1 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Star
                        className={`size-8 ${
                          n <= reviewForm.rating
                            ? "fill-amber-600 text-amber-600"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comment</label>
                <textarea
                  rows={8}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  className="w-full rounded-2xl border p-4 bg-background resize-y min-h-[160px]"
                  placeholder="Paste review text here..."
                />
              </div>
            </div>
            <div className="sticky bottom-0 bg-background border-t p-5 flex justify-end gap-3">
              <Button variant="outline" className="rounded-2xl h-12" onClick={closeReviewModal}>
                Cancel
              </Button>
              <Button
                className="rounded-2xl h-12 px-6"
                disabled={savingReview}
                onClick={saveReview}
              >
                {savingReview && <Loader2 className="size-4 animate-spin" />}
                {savingReview ? "Saving..." : editingReview ? "Save changes" : "Add review"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">Delete review?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the review from{" "}
              <strong>{deleteTarget?.guest_name}</strong>. It will no longer appear on the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={deleteReview}
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
