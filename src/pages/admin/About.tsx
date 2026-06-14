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

type ImageField = "image_url" | "image_url_2" | "image_url_3";

type Section = {
  id: string;
  section_key: string;
  title: string;
  subtitle: string;
  content: string;
  image_url: string;
  image_url_2: string;
  image_url_3: string;
  updated_at: string;
};

type SectionMeta = {
  label: string;
  description: string;
  group: string;
  titleLabel?: string;
  subtitleLabel?: string;
  contentHint?: string;
  showTitle?: boolean;
  showSubtitle?: boolean;
  showContent?: boolean;
  images?: { field: ImageField; label: string }[];
};

const SECTION_KEYS = [
  "about_hero",
  "about_intro",
  "about_rooms_header",
  "about_room_1",
  "about_room_2",
  "about_room_3",
  "about_room_4",
  "about_table",
  "about_philosophy",
  "about_stat_1",
  "about_stat_2",
  "about_stat_3",
  "about_stat_4",
  "about_tiffin_header",
  "about_tiffin_smoke",
  "about_tiffin_earth",
  "about_tiffin_memory",
  "about_tiffin_quote",
  "about_invite",
] as const;

const INTRO_COLLAGE_KEYS = {
  food: "about_intro_food",
  room: "about_intro_room",
} as const;

const FETCH_KEYS = [
  ...SECTION_KEYS,
  INTRO_COLLAGE_KEYS.food,
  INTRO_COLLAGE_KEYS.room,
] as const;

const SECTION_GROUPS = [
  "Hero",
  "Our Story",
  "Four Rooms",
  "The Table",
  "Philosophy & Stats",
  "Tiffin Box",
  "Invitation",
] as const;

const SECTION_LABELS: Record<string, SectionMeta> = {
  about_hero: {
    group: "Hero",
    label: "Hero Banner",
    description: "Full-width hero image, label, heading, italic line, and body text.",
    subtitleLabel: "Label",
    contentHint: "italic line | body paragraph",
    showSubtitle: true,
    showContent: true,
    images: [{ field: "image_url", label: "Hero image" }],
  },
  about_intro: {
    group: "Our Story",
    label: "A sanctuary, not a hotel",
    description: "Heading, three text blocks, and the three-image collage.",
    contentHint: "paragraph 1 | paragraph 2 | quote",
    showContent: true,
    images: [
      { field: "image_url", label: "Large image (left)" },
      { field: "image_url_2", label: "Top-right image" },
      { field: "image_url_3", label: "Bottom-right image" },
    ],
  },
  about_rooms_header: {
    group: "Four Rooms",
    label: "Section Header",
    description: "Label, heading, and intro paragraph above the four rooms.",
    subtitleLabel: "Section label",
    titleLabel: "Heading",
    contentHint: "Use | to split heading for italic part, e.g. Four States|of Being",
    showSubtitle: true,
    showContent: true,
  },
  about_room_1: {
    group: "Four Rooms",
    label: "The Banyan",
    description: "Room name, type, traits, and description.",
    subtitleLabel: "Room type",
    contentHint: "traits | description",
    showSubtitle: true,
    showContent: true,
  },
  about_room_2: {
    group: "Four Rooms",
    label: "The Canopy",
    description: "Room name, type, traits, and description.",
    subtitleLabel: "Room type",
    contentHint: "traits | description",
    showSubtitle: true,
    showContent: true,
  },
  about_room_3: {
    group: "Four Rooms",
    label: "The Nest",
    description: "Room name, type, traits, and description.",
    subtitleLabel: "Room type",
    contentHint: "traits | description",
    showSubtitle: true,
    showContent: true,
  },
  about_room_4: {
    group: "Four Rooms",
    label: "The Burrow",
    description: "Room name, type, traits, and description.",
    subtitleLabel: "Room type",
    contentHint: "traits | description",
    showSubtitle: true,
    showContent: true,
  },
  about_table: {
    group: "The Table",
    label: "The Table",
    description: "Heading, three text blocks, and section image.",
    contentHint: "paragraph 1 | paragraph 2 | quote",
    showContent: true,
    images: [{ field: "image_url", label: "Section image" }],
  },
  about_philosophy: {
    group: "Philosophy & Stats",
    label: "Philosophy",
    description: "Heading, body text, and side image.",
    showContent: true,
    images: [{ field: "image_url", label: "Section image" }],
  },
  about_stat_1: {
    group: "Philosophy & Stats",
    label: "Stat · Rooms",
    description: "Animated stat below philosophy text.",
    titleLabel: "Label",
    subtitleLabel: "Number",
    contentHint: "Suffix only, e.g. + or ★ (leave empty if none)",
    showSubtitle: true,
    showContent: true,
  },
  about_stat_2: {
    group: "Philosophy & Stats",
    label: "Stat · Dishes",
    description: "Animated stat below philosophy text.",
    titleLabel: "Label",
    subtitleLabel: "Number",
    contentHint: "Suffix only, e.g. + or ★ (leave empty if none)",
    showSubtitle: true,
    showContent: true,
  },
  about_stat_3: {
    group: "Philosophy & Stats",
    label: "Stat · Years",
    description: "Animated stat below philosophy text.",
    titleLabel: "Label",
    subtitleLabel: "Number",
    contentHint: "Suffix only, e.g. + or ★ (leave empty if none)",
    showSubtitle: true,
    showContent: true,
  },
  about_stat_4: {
    group: "Philosophy & Stats",
    label: "Stat · Rating",
    description: "Animated stat below philosophy text.",
    titleLabel: "Label",
    subtitleLabel: "Number",
    contentHint: "Suffix only, e.g. + or ★ (leave empty if none)",
    showSubtitle: true,
    showContent: true,
  },
  about_tiffin_header: {
    group: "Tiffin Box",
    label: "Tiffin Header",
    description: "Label, heading, and intro paragraph.",
    subtitleLabel: "Section label",
    titleLabel: "Heading",
    contentHint: "Use | for italic split, e.g. An Awakening of|Forgotten Flavours",
    showSubtitle: true,
    showContent: true,
  },
  about_tiffin_smoke: {
    group: "Tiffin Box",
    label: "Pillar · Smoke",
    description: "Title and description for the Smoke pillar.",
    showContent: true,
  },
  about_tiffin_earth: {
    group: "Tiffin Box",
    label: "Pillar · Earth",
    description: "Title and description for the Earth pillar.",
    showContent: true,
  },
  about_tiffin_memory: {
    group: "Tiffin Box",
    label: "Pillar · Memory",
    description: "Title and description for the Memory pillar.",
    showContent: true,
  },
  about_tiffin_quote: {
    group: "Tiffin Box",
    label: "Tiffin Quote",
    description: "Closing quote above the Discover Tiffin Box button.",
    titleLabel: "Quote",
    showTitle: true,
    showContent: false,
    showSubtitle: false,
  },
  about_invite: {
    group: "Invitation",
    label: "The Invitation",
    description: "Closing quote, description, and background image.",
    titleLabel: "Quote",
    subtitleLabel: "Description",
    showSubtitle: true,
    images: [{ field: "image_url", label: "Background image" }],
  },
};

const EMPTY_SECTION = (key: string): Section => ({
  id: "",
  section_key: key,
  title: "",
  subtitle: "",
  content: "",
  image_url: "",
  image_url_2: "",
  image_url_3: "",
  updated_at: "",
});

function sortSections(rows: Section[]): Section[] {
  return [...rows].sort(
    (a, b) =>
      SECTION_KEYS.indexOf(a.section_key as (typeof SECTION_KEYS)[number]) -
      SECTION_KEYS.indexOf(b.section_key as (typeof SECTION_KEYS)[number]),
  );
}

function mergeSections(rows: Section[]): Section[] {
  return sortSections(
    SECTION_KEYS.map((key) => rows.find((row) => row.section_key === key) ?? EMPTY_SECTION(key)),
  );
}

function mergeIntroCollageImages(rows: Section[]): Section[] {
  const food = rows.find((r) => r.section_key === INTRO_COLLAGE_KEYS.food);
  const room = rows.find((r) => r.section_key === INTRO_COLLAGE_KEYS.room);

  return rows
    .filter((r) => SECTION_KEYS.includes(r.section_key as (typeof SECTION_KEYS)[number]))
    .map((row) => {
      if (row.section_key !== "about_intro") return row;
      return {
        ...row,
        image_url_2: food?.image_url || "",
        image_url_3: room?.image_url || "",
      };
    });
}

async function upsertCmsRow(
  sectionKey: string,
  fields: Record<string, string>,
  existingId?: string,
) {
  const payload = {
    section_key: sectionKey,
    title: "",
    subtitle: "",
    content: "",
    image_url: "",
    ...fields,
    updated_at: new Date().toISOString(),
  };

  if (existingId) {
    return supabase.from("cms_content").update(payload).eq("id", existingId);
  }
  return supabase.from("cms_content").upsert(payload, { onConflict: "section_key" });
}

export default function AboutAdminPage() {
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<ImageField | null>(null);
  const [message, setMessage] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    try {
      setLoadError("");
      const { data, error } = await supabase
        .from("cms_content")
        .select("*")
        .in("section_key", [...FETCH_KEYS]);

      if (error) {
        console.error(error);
        setLoadError(error.message);
        setSections(mergeSections([]));
        return;
      }
      setSections(mergeSections(mergeIntroCollageImages((data as Section[]) || [])));
    } catch (error) {
      console.error(error);
      setLoadError(error instanceof Error ? error.message : "Failed to load sections");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editing) return;
    setEditing({ ...editing, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: ImageField,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;

    try {
      setUploadingField(field);
      const fileName = `about-${field}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("about").upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert("Upload failed");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("about").getPublicUrl(fileName);
      setEditing({ ...editing, [field]: publicUrl });
    } catch (error) {
      console.error(error);
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!editing) return;
    try {
      setSaving(true);
      setMessage("");

      if (editing.section_key === "about_intro") {
        const mainPayload: Record<string, string> = {
          section_key: editing.section_key,
          title: editing.title,
          subtitle: editing.subtitle,
          content: editing.content,
          image_url: editing.image_url,
        };

        const mainResult = editing.id
          ? await supabase.from("cms_content").update(mainPayload).eq("id", editing.id)
          : await supabase
              .from("cms_content")
              .upsert(
                { ...mainPayload, updated_at: new Date().toISOString() },
                { onConflict: "section_key" },
              );

        if (mainResult.error) {
          console.error(mainResult.error);
          alert(`Failed to save: ${mainResult.error.message}`);
          return;
        }

        const { data: collageRows } = await supabase
          .from("cms_content")
          .select("id, section_key")
          .in("section_key", [INTRO_COLLAGE_KEYS.food, INTRO_COLLAGE_KEYS.room]);

        const foodId = collageRows?.find((r) => r.section_key === INTRO_COLLAGE_KEYS.food)?.id;
        const roomId = collageRows?.find((r) => r.section_key === INTRO_COLLAGE_KEYS.room)?.id;

        const foodResult = await upsertCmsRow(
          INTRO_COLLAGE_KEYS.food,
          { image_url: editing.image_url_2 },
          foodId,
        );
        if (foodResult.error) {
          console.error(foodResult.error);
          alert(`Failed to save top-right image: ${foodResult.error.message}`);
          return;
        }

        const roomResult = await upsertCmsRow(
          INTRO_COLLAGE_KEYS.room,
          { image_url: editing.image_url_3 },
          roomId,
        );
        if (roomResult.error) {
          console.error(roomResult.error);
          alert(`Failed to save bottom-right image: ${roomResult.error.message}`);
          return;
        }

        setMessage("Saved successfully");
        setEditing(null);
        loadSections();
        setTimeout(() => setMessage(""), 3000);
        return;
      }

      const meta = SECTION_LABELS[editing.section_key];
      const imageFields = new Set(meta?.images?.map((img) => img.field) ?? []);

      const payload: Record<string, string> = {
        section_key: editing.section_key,
        title: editing.title,
        subtitle: editing.subtitle,
        content: editing.content,
        updated_at: new Date().toISOString(),
      };

      if (imageFields.has("image_url")) payload.image_url = editing.image_url;

      const { error } = editing.id
        ? await supabase.from("cms_content").update(payload).eq("id", editing.id)
        : await supabase
            .from("cms_content")
            .upsert(payload, { onConflict: "section_key" });

      if (error) {
        console.error(error);
        alert(`Failed to save: ${error.message}`);
        return;
      }

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

  const meta = editing ? SECTION_LABELS[editing.section_key] : undefined;
  const showTitle = meta?.showTitle !== false;
  const showSubtitle = meta?.showSubtitle === true;
  const showContent = meta?.showContent === true;
  const contentRows =
    editing?.section_key === "about_intro" ||
    editing?.section_key === "about_table" ||
    editing?.section_key.startsWith("about_room_")
      ? 8
      : 5;

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 md:space-y-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold">About Page</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Edit every section of the About page. Changes reflect on the main site after save.
          </p>
        </div>
        {message && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4 shrink-0" /> {message}
          </div>
        )}
      </div>

      {loadError && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p className="font-medium">Could not load About content from Supabase</p>
          <p className="mt-1 text-destructive/90">{loadError}</p>
          <p className="mt-2 text-muted-foreground">
            Run <code className="text-xs">supabase/run_about_cms_setup.sql</code> in the Supabase SQL
            Editor, then refresh this page.
          </p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading sections...
        </div>
      ) : (
        <div className="space-y-8">
          {SECTION_GROUPS.map((group) => {
            const groupSections = sections.filter(
              (s) => SECTION_LABELS[s.section_key]?.group === group,
            );
            if (groupSections.length === 0) return null;

            return (
              <div key={group} className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {group}
                </h2>
                <div className="space-y-4">
                  {groupSections.map((section) => {
                    const sectionMeta = SECTION_LABELS[section.section_key];
                    const images = [
                      section.image_url,
                      section.image_url_2,
                      section.image_url_3,
                    ].filter(Boolean);

                    return (
                      <div
                        key={section.section_key}
                        className="rounded-3xl border bg-background p-4 sm:p-6"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-1 flex-1 min-w-0">
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                              <h3 className="text-base sm:text-lg font-semibold">
                                {sectionMeta?.label || section.section_key}
                              </h3>
                              {!section.id && (
                                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-xs">
                                  Not saved yet
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{sectionMeta?.description}</p>

                            <div className="pt-3 space-y-2 sm:space-y-3">
                              {section.title && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {sectionMeta?.titleLabel || "Title / Heading"}
                                  </p>
                                  <p className="text-sm font-medium break-words">{section.title}</p>
                                </div>
                              )}
                              {section.subtitle && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {sectionMeta?.subtitleLabel || "Subtitle"}
                                  </p>
                                  <p className="text-sm break-words">{section.subtitle}</p>
                                </div>
                              )}
                              {section.content && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Content</p>
                                  <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                                    {section.content}
                                  </p>
                                </div>
                              )}
                              {images.length > 0 && (
                                <div className="flex flex-wrap gap-2 pt-1">
                                  {images.map((url) => (
                                    <img
                                      key={url}
                                      src={url}
                                      alt=""
                                      className="w-24 h-16 sm:w-32 sm:h-20 object-cover rounded-xl border"
                                    />
                                  ))}
                                </div>
                              )}
                            </div>

                            {section.updated_at && (
                              <p className="text-xs text-muted-foreground pt-2">
                                Last updated: {new Date(section.updated_at).toLocaleString()}
                              </p>
                            )}
                          </div>

                          <button
                            onClick={() => setEditing(section)}
                            className="size-10 sm:size-11 rounded-2xl border flex items-center justify-center hover:bg-muted transition-colors shrink-0"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editing && meta && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5">
          <div className="w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-background border max-h-[92vh] sm:max-h-[94vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-4 sm:p-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold truncate">{meta.label}</h2>
                <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>
              </div>
              <button
                onClick={() => setEditing(null)}
                className="size-10 sm:size-11 rounded-2xl border flex items-center justify-center shrink-0"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              {showTitle && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{meta.titleLabel || "Title / Heading"}</label>
                  <input
                    type="text"
                    name="title"
                    value={editing.title}
                    onChange={handleChange}
                    className="w-full h-11 sm:h-12 rounded-2xl border px-4 bg-background text-sm sm:text-base"
                  />
                </div>
              )}

              {showSubtitle && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{meta.subtitleLabel || "Subtitle"}</label>
                  {editing.section_key === "about_hero" ||
                  editing.section_key.startsWith("about_stat_") ||
                  editing.section_key === "about_rooms_header" ||
                  editing.section_key === "about_tiffin_header" ? (
                    <input
                      type="text"
                      name="subtitle"
                      value={editing.subtitle}
                      onChange={handleChange}
                      className="w-full h-11 sm:h-12 rounded-2xl border px-4 bg-background text-sm sm:text-base"
                    />
                  ) : (
                    <textarea
                      rows={3}
                      name="subtitle"
                      value={editing.subtitle}
                      onChange={handleChange}
                      className="w-full rounded-2xl border p-4 bg-background resize-none text-sm sm:text-base"
                    />
                  )}
                </div>
              )}

              {showContent && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {editing.section_key.startsWith("about_stat_") ? "Suffix" : "Content"}
                    {meta.contentHint && (
                      <span className="text-muted-foreground font-normal ml-2 text-xs hidden sm:inline">
                        — {meta.contentHint}
                      </span>
                    )}
                  </label>
                  {meta.contentHint && (
                    <p className="text-xs text-muted-foreground">{meta.contentHint}</p>
                  )}
                  <textarea
                    rows={contentRows}
                    name="content"
                    value={editing.content}
                    onChange={handleChange}
                    className="w-full rounded-2xl border p-4 bg-background resize-none text-sm sm:text-base"
                  />
                </div>
              )}

              {meta.images?.map(({ field, label }) => {
                const url = editing[field];
                const uploading = uploadingField === field;
                return (
                  <div key={field} className="space-y-2">
                    <label className="text-sm font-medium">{label}</label>
                    <label className="border-2 border-dashed rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col items-center justify-center gap-2 sm:gap-3 cursor-pointer hover:bg-muted/40 transition-colors">
                      <ImagePlus className="size-7 sm:size-8 text-muted-foreground" />
                      <span className="text-xs sm:text-sm text-muted-foreground text-center">
                        Tap to upload
                      </span>
                      <div className="inline-flex items-center gap-2 text-sm font-medium">
                        {uploading ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Upload className="size-4" />
                        )}
                        {uploading ? "Uploading..." : "Upload Image"}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, field)}
                        className="hidden"
                      />
                    </label>
                    {url && (
                      <img
                        src={url}
                        alt={label}
                        className="w-full h-48 sm:h-64 object-cover rounded-2xl sm:rounded-3xl border"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="sticky bottom-0 bg-background border-t p-4 sm:p-5 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="hidden sm:block">
                {message && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle2 className="size-4" /> {message}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setEditing(null)}
                  className="flex-1 sm:flex-none h-11 sm:h-12 px-5 rounded-2xl border text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 sm:flex-none h-11 sm:h-12 px-6 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center justify-center gap-2 disabled:opacity-70 text-sm sm:text-base"
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
