
import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  CheckCircle2,
  ImagePlus,
  Eye,
  BarChart3,
  Upload,
  X,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getImageUploadError } from "@/lib/validate-image-upload";

type TiffinContent = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  quote: string;
  hero_image: string;
  hero_caption: string;
  booking_url: string;
  gallery_images: string[];
  created_at?: string;
};

type Analytics = {
  id: string;
  page: string;
  cta: string;
  created_at: string;
};

const emptyContent: TiffinContent = {
  id: "",
  title: "",
  subtitle: "",
  description: "",
  quote: "",
  hero_image: "",
  hero_caption: "",
  booking_url: "https://thenortheasttiffinbox.petpooja.com/",
  gallery_images: [],
};

export default function TiffinboxAdminPage() {
  const [content, setContent] = useState<TiffinContent[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<TiffinContent | null>(null);
  const [viewing, setViewing] = useState<TiffinContent | null>(null);

  const [message, setMessage] = useState("");

  const [preview, setPreview] = useState("");
  const [galleryUploading, setGalleryUploading] = useState(false);
const [galleryPreview, setGalleryPreview] = useState<string[]>([]);


  const [showEditor, setShowEditor] = useState(false);

  const totalClicks = useMemo(() => analytics.length, [analytics]);

  useEffect(() => {
    loadContent();
    loadAnalytics();
  }, []);

  const loadContent = async () => {
    try {
      const { data, error } = await supabase
        .from("tiffin_box_content")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setContent(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("tiffin_box_clicks")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        return;
      }

      setAnalytics(data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (!editing) return;

    setEditing({
      ...editing,
      [e.target.name]: e.target.value,
    });
  };

  const handleGalleryChange = (value: string) => {
    if (!editing) return;

    setEditing({
      ...editing,
      gallery_images: value
        .split(",")
        .map((img) => img.trim())
        .filter(Boolean),
    });
  };

  const handleHeroUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !editing) return;

    const validationError = getImageUploadError(file);
    if (validationError) {
      alert(validationError);
      e.target.value = "";
      return;
    }

    try {
      setMessage("");

      const localPreview = URL.createObjectURL(file);

      setPreview(localPreview);

      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("tiffinbox")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert("Upload failed");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("tiffinbox")
        .getPublicUrl(fileName);

      setPreview(publicUrl);

      setEditing({
        ...editing,
        hero_image: publicUrl,
      });

      setMessage("Image uploaded successfully");
    } catch (error) {
      console.error(error);
    }
  };


  const handleGalleryUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
  
    if (!files || !editing) return;
  
    try {
      setGalleryUploading(true);
  
      const uploadedUrls: string[] = [];
  
      for (const file of Array.from(files)) {
        const validationError = getImageUploadError(file);
        if (validationError) {
          alert(`${file.name}: ${validationError}`);
          continue;
        }

        const fileName = `gallery-${Date.now()}-${file.name}`;
  
        const { error: uploadError } = await supabase.storage
          .from("tiffinbox")
          .upload(fileName, file);
  
        if (uploadError) {
          console.error(uploadError);
          alert(`Failed to upload ${file.name}`);
          continue;
        }
  
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("tiffinbox")
          .getPublicUrl(fileName);
  
        uploadedUrls.push(publicUrl);
      }
  
      if (uploadedUrls.length === 0) return;
  
      setEditing((prev) => {
        if (!prev) return prev;
        const updated = [...(prev.gallery_images || []), ...uploadedUrls];
        setGalleryPreview(updated);
        return { ...prev, gallery_images: updated };
      });
  
      setMessage(`${uploadedUrls.length} image(s) uploaded successfully`);
    } catch (error) {
      console.error(error);
    } finally {
      setGalleryUploading(false);
    }
  };


  
  const handleEditContent = (item: TiffinContent) => {
    setEditing(item);
    setPreview(item.hero_image || "");
    setGalleryPreview(item.gallery_images || []);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!editing) return;

    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("tiffin_box_content")
        .upsert(editing);

      if (error) {
        console.error(error);
        alert("Failed to save content");
        return;
      }

      setMessage("Content saved successfully");

      setShowEditor(false);

      loadContent();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this content?"
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("tiffin_box_content")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        alert("Failed to delete");
        return;
      }

      loadContent();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold">
            Tiffin Box Management
          </h1>

          <p className="text-muted-foreground mt-2">
            Manage Tiffin Box content, gallery, hero section,
            booking links and analytics.
          </p>
        </div>

        {/* <button
          onClick={handleAddContent}
          className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 shadow-sm"
        >
          <Plus className="size-4" />
          Add Content
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Sections
              </p>

              <h2 className="text-3xl font-semibold mt-2">
                {content.length}
              </h2>
            </div>

            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <Eye className="size-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Booking Clicks
              </p>

              <h2 className="text-3xl font-semibold mt-2">
                {totalClicks}
              </h2>
            </div>

            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <BarChart3 className="size-6" />
            </div>
          </div>
        </div>

        <div className="rounded-3xl border bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Gallery Images
              </p>

              <h2 className="text-3xl font-semibold mt-2">
                {content.reduce(
                  (acc, item) => acc + item.gallery_images.length,
                  0
                )}
              </h2>
            </div>

            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <ImagePlus className="size-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">
            Booking Analytics
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Track Tiffin Box booking interactions.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-4 font-medium">
                  Page
                </th>

                <th className="text-left px-4 py-4 font-medium">
                  CTA
                </th>

                <th className="text-left px-4 py-4 font-medium">
                  Time
                </th>
              </tr>
            </thead>

            <tbody>
              {analytics.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="px-4 py-4">
                    {a.page}
                  </td>

                  <td className="px-4 py-4">
                    {a.cta}
                  </td>

                  <td className="px-4 py-4 text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-3xl border bg-background p-6 space-y-6">
  <div>
    <h2 className="text-xl font-semibold">
      Existing Content
    </h2>

    <p className="text-sm text-muted-foreground mt-1">
      Manage the content displayed on the main Tiffin Box page.
    </p>
  </div>

  {loading ? (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading content...
    </div>
  ) : content.length === 0 ? (
    <div className="rounded-2xl border border-dashed p-10 text-center">
      <p className="text-muted-foreground">
        No content found in Supabase.
      </p>
    </div>
  ) : (
    <div className="space-y-6">
      {content.map((item) => (
        <div
          key={item.id}
          className="rounded-3xl border overflow-hidden bg-background"
        >
          <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr]">
            <div className="relative">
              <img
                src={item.hero_image}
                alt={item.title}
                className="w-full h-full object-cover min-h-[340px]"
              />

              {item.hero_caption && (
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/60 text-white p-4 backdrop-blur-sm">
                  <p className="text-sm">
                    {item.hero_caption}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 flex flex-col justify-between gap-6">
              <div className="space-y-5">
                <div>
                  <h3 className="text-3xl font-semibold">
                    {item.title}
                  </h3>

                  <p className="text-muted-foreground mt-3 leading-relaxed">
                    {item.subtitle}
                  </p>
                </div>

                <p className="leading-relaxed text-sm text-muted-foreground">
                  {item.description}
                </p>

                {item.quote && (
                  <div className="rounded-2xl border bg-muted/30 p-5 italic text-muted-foreground">
                    “{item.quote}”
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Food Gallery
                    </h4>

                    <span className="text-sm text-muted-foreground">
                      {item.gallery_images?.length || 0} images
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {item.gallery_images?.map((img, index) => (
                      <img
                        key={index}
                        src={img}
                        alt="Gallery"
                        className="w-full h-28 rounded-2xl object-cover border"
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setViewing(item)}
                  className="h-11 px-5 rounded-2xl border inline-flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Eye className="size-4" />
                  Preview
                </button>

                <button
                  onClick={() => handleEditContent(item)}
                  className="h-11 px-5 rounded-2xl border inline-flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Pencil className="size-4" />
                  Edit Content
                </button>

                <button
                  onClick={() => handleDelete(item.id)}
                  className="h-11 px-5 rounded-2xl border inline-flex items-center gap-2 hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-4 text-red-500" />
                  Delete
                </button>

                {item.booking_url && (
                  <a
                    href={item.booking_url}
                    target="_blank"
                    rel="noreferrer"
                    className="h-11 px-5 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2"
                  >
                    Open Booking
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-5xl rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Tiffin Box Details
              </h2>

              <button
                onClick={() => setViewing(null)}
                className="size-10 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <img
                src={viewing.hero_image}
                alt={viewing.title}
                className="w-full h-[380px] object-cover rounded-3xl border"
              />

              <div className="space-y-4">
                <h2 className="text-3xl font-semibold">
                  {viewing.title}
                </h2>

                <p className="text-muted-foreground leading-relaxed">
                  {viewing.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditor && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-6xl rounded-3xl bg-background border max-h-[94vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {editing.id
                    ? "Edit Tiffin Box Content"
                    : "Add Tiffin Box Content"}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Changes here will reflect on the main
                  Tiffin Box page.
                </p>
              </div>

              <button
                onClick={() => setShowEditor(false)}
                className="size-11 rounded-2xl border flex items-center justify-center"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Title
                  </label>

                  <input
                    type="text"
                    name="title"
                    value={editing.title}
                    onChange={handleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Subtitle
                  </label>

                  <textarea
                    rows={4}
                    name="subtitle"
                    value={editing.subtitle}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Description
                  </label>

                  <textarea
                    rows={8}
                    name="description"
                    value={editing.description}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Quote
                  </label>

                  <textarea
                    rows={4}
                    name="quote"
                    value={editing.quote}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Upload Hero Image
                  </label>

                  <label className="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/40 transition-colors">
                    <ImagePlus className="size-10 text-muted-foreground" />

                    <span className="text-sm text-muted-foreground">
                      Click to upload image
                    </span>

                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      <Upload className="size-4" />
                      Upload Image
                    </div>

                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroUpload}
                      className="hidden"
                    />
                  </label>

                  {(preview || editing.hero_image) && (
                    <img
                      src={preview || editing.hero_image}
                      alt="Preview"
                      className="w-full h-72 object-cover rounded-3xl border"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Hero Caption
                  </label>

                  <input
                    type="text"
                    name="hero_caption"
                    value={editing.hero_caption}
                    onChange={handleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Booking URL
                  </label>

                  <input
                    type="text"
                    name="booking_url"
                    value={editing.booking_url}
                    onChange={handleChange}
                    className="w-full h-12 rounded-2xl border px-4 bg-background"
                  />
                </div>

                {/* <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Gallery Images URLs
                  </label>

                  <textarea
                    rows={6}
                    value={editing.gallery_images.join(", ")}
                    onChange={(e) =>
                      handleGalleryChange(e.target.value)
                    }
                    className="w-full rounded-2xl border p-4 bg-background"
                    placeholder="Paste image URLs separated by commas"
                  />
                </div> */}

<div className="space-y-4">
  <div className="flex items-center justify-between">
    <label className="text-sm font-medium">
      Food Gallery
    </label>

    <label className="h-10 px-4 rounded-2xl border inline-flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors">
      {galleryUploading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <ImagePlus className="size-4" />
      )}

      Add Images

      <input
        type="file"
        multiple
        accept="image/*"
        onChange={handleGalleryUpload}
        className="hidden"
      />
    </label>
  </div>

  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
    {(galleryPreview.length > 0
      ? galleryPreview
      : editing.gallery_images
    )?.map((img, index) => (
      <div
        key={index}
        className="relative group"
      >
        <img
          src={img}
          alt="Gallery"
          className="w-full h-32 rounded-2xl object-cover border"
        />

        <button
          type="button"
          onClick={() => {
            const updated =
              editing.gallery_images.filter(
                (_, i) => i !== index
              );

            setEditing({
              ...editing,
              gallery_images: updated,
            });

            setGalleryPreview(updated);
          }}
          className="absolute top-2 right-2 size-8 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="size-4" />
        </button>
      </div>
    ))}
  </div>
</div>


              </div>
            </div>

            <div className="sticky bottom-0 bg-background border-t p-5 flex items-center justify-between">
              <div>
                {message && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="size-4" />
                    {message}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowEditor(false)}
                  className="h-12 px-5 rounded-2xl border"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-70"
                >
                  {saving && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {saving
                    ? "Saving..."
                    : editing.id
                    ? "Update Content"
                    : "Create Content"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}