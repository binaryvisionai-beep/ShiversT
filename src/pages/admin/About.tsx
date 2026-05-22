import { useEffect, useState } from "react";
import {
  Loader2,
  CheckCircle2,
  Pencil,
  X,
  ImagePlus,
  Upload,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Section = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  updated_at: string;
};

const SECTION_LABELS: Record<string, { label: string; description: string; hasImage: boolean; contentHint?: string }> = {
  about_intro: {
    label: "Chapter I · The House",
    description: "Heading and two body paragraphs shown in the intro section.",
    hasImage: false,
    contentHint: "Separate the two paragraphs with a pipe character |",
  },
  about_philosophy: {
    label: "Chapter III · Philosophy",
    description: "Heading, body text, and the philosophy section image.",
    hasImage: true,
  },
  about_invite: {
    label: "The Invitation",
    description: "The closing quote and description shown in the dark invitation section.",
    hasImage: false,
  },
};

export default function AboutAdminPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      const { data, error } = await supabase
        .from("cms_content")
        .select("*")
        .in("section_key", ["about_intro", "about_philosophy", "about_invite"])
        .order("section_key");

      if (error) { console.error(error); return; }
      setSections(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editing) return;
    setEditing({ ...editing, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    try {
      setUploading(true);
      const local = URL.createObjectURL(file);
      setPreview(local);

      const fileName = `about-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("homepage").upload(fileName, file);

      if (uploadError) { console.error(uploadError); alert("Upload failed"); return; }

      const { data: { publicUrl } } = supabase.storage.from("homepage").getPublicUrl(fileName);
      setPreview(publicUrl);
      setEditing({ ...editing, image_url: publicUrl });
    } catch (error) {
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setMessage("");

      const { error } = await supabase
        .from("cms_content")
        .upsert({ ...editing, updated_at: new Date().toISOString() });

      if (error) { console.error(error); alert("Failed to save"); return; }

      setMessage("Saved successfully");
      setEditing(null);
      loadSections();
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold">About Page</h1>
          <p className="text-muted-foreground mt-2">
            Edit content for each section of the About page. Changes reflect instantly on the main site.
          </p>
        </div>
        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4" /> {message}
          </div>
        )}
      </div>

      {/* SECTIONS */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading sections...
        </div>
      ) : (
        <div className="space-y-5">
          {sections.map((section) => {
            const meta = SECTION_LABELS[section.section_key];
            return (
              <div key={section.id} className="rounded-3xl border bg-background p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-lg font-semibold">{meta?.label || section.section_key}</h2>
                      <span className="px-3 py-1 rounded-full bg-muted text-xs font-mono">{section.section_key}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{meta?.description}</p>

                    <div className="pt-4 space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Title / Heading</p>
                        <p className="text-sm font-medium">{section.title || "—"}</p>
                      </div>
                      {section.subtitle && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Subtitle</p>
                          <p className="text-sm">{section.subtitle}</p>
                        </div>
                      )}
                      {section.content && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Content</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{section.content}</p>
                        </div>
                      )}
                      {section.image_url && (
                        <img
                          src={section.image_url}
                          alt="section"
                          className="w-40 h-24 object-cover rounded-2xl border mt-2"
                        />
                      )}
                    </div>

                    <p className="text-xs text-muted-foreground pt-2">
                      Last updated: {new Date(section.updated_at).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => { setEditing(section); setPreview(section.image_url || ""); }}
                    className="size-11 rounded-2xl border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDITOR MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-2xl rounded-3xl bg-background border max-h-[94vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">
                  {SECTION_LABELS[editing.section_key]?.label || editing.section_key}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">Changes reflect on the main About page.</p>
              </div>
              <button onClick={() => setEditing(null)} className="size-11 rounded-2xl border flex items-center justify-center">
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Title / Heading</label>
                <input
                  type="text"
                  name="title"
                  value={editing.title}
                  onChange={handleChange}
                  className="w-full h-12 rounded-2xl border px-4 bg-background"
                />
              </div>

              {editing.section_key === "about_invite" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subtitle / Description</label>
                  <textarea
                    rows={3}
                    name="subtitle"
                    value={editing.subtitle}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background resize-none"
                  />
                </div>
              )}

              {editing.section_key !== "about_invite" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Content
                    {SECTION_LABELS[editing.section_key]?.contentHint && (
                      <span className="text-muted-foreground font-normal ml-2 text-xs">
                        {SECTION_LABELS[editing.section_key].contentHint}
                      </span>
                    )}
                  </label>
                  <textarea
                    rows={editing.section_key === "about_intro" ? 8 : 5}
                    name="content"
                    value={editing.content}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background resize-none"
                  />
                </div>
              )}

              {SECTION_LABELS[editing.section_key]?.hasImage && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Section Image</label>
                  <label className="border-2 border-dashed rounded-3xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors">
                    <ImagePlus className="size-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload image</span>
                    <div className="inline-flex items-center gap-2 text-sm font-medium">
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                      {uploading ? "Uploading..." : "Upload Image"}
                    </div>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  {(preview || editing.image_url) && (
                    <img
                      src={preview || editing.image_url}
                      alt="Preview"
                      className="w-full h-64 object-cover rounded-3xl border"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-background border-t p-5 flex items-center justify-between">
              <div>
                {message && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="size-4" /> {message}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setEditing(null)} className="h-12 px-5 rounded-2xl border">Cancel</button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 disabled:opacity-70"
                >
                  {saving && <Loader2 className="size-4 animate-spin" />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}