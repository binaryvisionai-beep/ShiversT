import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Trash2,
  ExternalLink,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
type UploadField =
  | "logo"
  | "welcomeCard1Image"
  | "welcomeCard2Image"
  | "welcomeCard3Image"
  | "welcomeCard4Image"
  | "offering1Image"
  | "offering2Image"
  | "offering3Image"
  | "whyChoose1Image"
  | "whyChoose2Image"
  | "whyChoose3Image"
  | "whyChoose4Image";

// ─── Hero library helpers ─────────────────────────────────────────────────────
function parseHeroImagesLibrary(stored: unknown): string[] {
  if (Array.isArray(stored))
    return stored.filter((u): u is string => typeof u === "string" && u.length > 0);

  if (typeof stored === "string" && stored.trim()) {
    try {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed))
        return parsed.filter((u): u is string => typeof u === "string" && u.length > 0);
    } catch {
      return [];
    }
  }
  return [];
}

function mergeHeroLibrary(liveHero: string, library: string[]): string[] {
  if (liveHero && !library.includes(liveHero)) return [liveHero, ...library];
  if (library.length > 0) return library;
  return liveHero ? [liveHero] : [];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminHomepagePage() {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  const [formData, setFormData] = useState({
    heroTitle: "Luxury Stays. Exquisite Dining. Unforgettable Moments.",
    heroDescription:
      "Experience the perfect blend of luxury hospitality, fine dining and memorable events.",
    heroImage: "",

    welcomeTitle: "Welcome to Shivers",
    welcomeDescription:
      "A serene luxury escape in North Goa offering premium rooms, a fine dining restaurant, delicious cuisine and stunning experiences.",

    logo: "",

    welcomeCard1Title: "Luxury Rooms",
    welcomeCard1Subtitle: "Comfort & Relaxation",
    welcomeCard1Image: "",

    welcomeCard2Title: "Fine Dining",
    welcomeCard2Subtitle: "Exquisite Cuisine",
    welcomeCard2Image: "",

    welcomeCard3Title: "Events & Celebrations",
    welcomeCard3Subtitle: "Memorable Moments",
    welcomeCard3Image: "",

    welcomeCard4Title: "Prime Location",
    welcomeCard4Subtitle: "Candolim, North Goa",
    welcomeCard4Image: "",

    whyChoose1Title: "Prime Location",
    whyChoose1Subtitle: "Heart of Candolim, North Goa",
    whyChoose1Image: "",

    whyChoose2Title: "Premium Hospitality",
    whyChoose2Subtitle: "Warm & Personalised Service",
    whyChoose2Image: "",

    whyChoose3Title: "Top Rated",
    whyChoose3Subtitle: "Loved by 1,000+ Guests",
    whyChoose3Image: "",

    whyChoose4Title: "Farm-Fresh Dining",
    whyChoose4Subtitle: "Seasonal, Locally Sourced Menus",
    whyChoose4Image: "",

    whyChoose5Title: "Best Price Guarantee",
    whyChoose5Subtitle: "Unbeatable Value, Always",

    offering1Title: "Shivers Oasis Luxury Rooms",
    offering1Subtitle: "Elegant rooms designed for your comfort and relaxation.",
    offering1Image: "",

    offering2Title: "Shivers Garden Restaurant",
    offering2Subtitle: "A perfect blend of ambience and flavours.",
    offering2Image: "",

    offering3Title: "Delicious Food Delivered",
    offering3Subtitle: "Tasty food delivered hot to your doorstep.",
    offering3Image: "",
  });

  const [preview, setPreview] = useState<Record<string, string>>({});
  const [heroImages, setHeroImages] = useState<string[]>([]);
  const [heroUploading, setHeroUploading] = useState(false);

  // ── Load existing data ───────────────────────────────────────────────────────
  const loadHomepage = async (isActive: () => boolean = () => true) => {
    try {
      const { data, error } = await supabase
        .from("homepage_content")
        .select("*")
        .single();

      if (!isActive() || error || !data) return;

      const liveHero = (data.hero_image as string) || "";
      const library = parseHeroImagesLibrary(data.hero_images);
      const merged = mergeHeroLibrary(liveHero, library);

      setHeroImages(merged);

      setFormData((prev) => ({
        ...prev,
        heroTitle: data.hero_title || prev.heroTitle,
        heroDescription: data.hero_description || prev.heroDescription,
        heroImage: liveHero || merged[0] || prev.heroImage,
        welcomeTitle: data.welcome_title || prev.welcomeTitle,
        welcomeDescription: data.welcome_description || prev.welcomeDescription,
        logo: data.logo || prev.logo,

        welcomeCard1Title: data.welcome_card_1_title || prev.welcomeCard1Title,
        welcomeCard1Subtitle: data.welcome_card_1_subtitle || prev.welcomeCard1Subtitle,
        welcomeCard1Image: data.welcome_card_1_image || prev.welcomeCard1Image,

        welcomeCard2Title: data.welcome_card_2_title || prev.welcomeCard2Title,
        welcomeCard2Subtitle: data.welcome_card_2_subtitle || prev.welcomeCard2Subtitle,
        welcomeCard2Image: data.welcome_card_2_image || prev.welcomeCard2Image,

        welcomeCard3Title: data.welcome_card_3_title || prev.welcomeCard3Title,
        welcomeCard3Subtitle: data.welcome_card_3_subtitle || prev.welcomeCard3Subtitle,
        welcomeCard3Image: data.welcome_card_3_image || prev.welcomeCard3Image,

        welcomeCard4Title: data.welcome_card_4_title || prev.welcomeCard4Title,
        welcomeCard4Subtitle: data.welcome_card_4_subtitle || prev.welcomeCard4Subtitle,
        welcomeCard4Image: data.welcome_card_4_image || prev.welcomeCard4Image,

        whyChoose1Title: data.why_choose_1_title || prev.whyChoose1Title,
        whyChoose1Subtitle: data.why_choose_1_subtitle || prev.whyChoose1Subtitle,
        whyChoose1Image: data.why_choose_1_image || prev.whyChoose1Image,

        whyChoose2Title: data.why_choose_2_title || prev.whyChoose2Title,
        whyChoose2Subtitle: data.why_choose_2_subtitle || prev.whyChoose2Subtitle,
        whyChoose2Image: data.why_choose_2_image || prev.whyChoose2Image,

        whyChoose3Title: data.why_choose_3_title || prev.whyChoose3Title,
        whyChoose3Subtitle: data.why_choose_3_subtitle || prev.whyChoose3Subtitle,
        whyChoose3Image: data.why_choose_3_image || prev.whyChoose3Image,

        whyChoose4Title: data.why_choose_4_title || prev.whyChoose4Title,
        whyChoose4Subtitle: data.why_choose_4_subtitle || prev.whyChoose4Subtitle,
        whyChoose4Image: data.why_choose_4_image || prev.whyChoose4Image,

        whyChoose5Title: data.why_choose_5_title || prev.whyChoose5Title,
        whyChoose5Subtitle: data.why_choose_5_subtitle || prev.whyChoose5Subtitle,

        offering1Title: data.offering_1_title || prev.offering1Title,
        offering1Subtitle: data.offering_1_subtitle || prev.offering1Subtitle,
        offering1Image: data.offering_1_image || prev.offering1Image,

        offering2Title: data.offering_2_title || prev.offering2Title,
        offering2Subtitle: data.offering_2_subtitle || prev.offering2Subtitle,
        offering2Image: data.offering_2_image || prev.offering2Image,

        offering3Title: data.offering_3_title || prev.offering3Title,
        offering3Subtitle: data.offering_3_subtitle || prev.offering3Subtitle,
        offering3Image: data.offering_3_image || prev.offering3Image,
      }));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let active = true;
    loadHomepage(() => active);
    return () => { active = false; };
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const persistHeroLibrary = async (library: string[], liveHero: string): Promise<boolean> => {
    const merged = mergeHeroLibrary(liveHero, library);
    const { error } = await supabase.from("homepage_content").upsert({
      id: "00000000-0000-0000-0000-000000000001",
      hero_image: liveHero,
      hero_images: merged,
    });
    if (error) { console.error(error); alert(error.message); return false; }
    setHeroImages(merged);
    return true;
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: UploadField
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setSaveMessage("");
      const localPreview = URL.createObjectURL(file);
      setPreview((prev) => ({ ...prev, [field]: localPreview }));

      const fileName = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("homepage").upload(fileName, file);

      if (error) { console.error(error); alert("Image upload failed: " + error.message); return; }

      const { data: { publicUrl } } = supabase.storage.from("homepage").getPublicUrl(fileName);

      setPreview((prev) => ({ ...prev, [field]: publicUrl }));
      setFormData((prev) => ({ ...prev, [field]: publicUrl }));
      setSaveMessage("Image uploaded — click Save to apply.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleHeroImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    try {
      setHeroUploading(true);
      setSaveMessage("");
      const uploadedUrls: string[] = [];

      for (const [index, file] of Array.from(files).entries()) {
        const fileName = `hero-${Date.now()}-${index}-${file.name}`;
        const { error } = await supabase.storage.from("homepage").upload(fileName, file);
        if (error) { console.error(error); alert(`Failed to upload ${file.name}`); continue; }
        const { data: { publicUrl } } = supabase.storage.from("homepage").getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }

      if (uploadedUrls.length === 0) return;

      const nextLibrary = [...heroImages];
      for (const url of uploadedUrls) {
        if (!nextLibrary.includes(url)) nextLibrary.push(url);
      }
      const nextLive = formData.heroImage || uploadedUrls[0];

      setHeroImages(nextLibrary);
      setFormData((prev) => ({ ...prev, heroImage: nextLive }));

      const saved = await persistHeroLibrary(nextLibrary, nextLive);
      setSaveMessage(
        saved
          ? `${uploadedUrls.length} hero image(s) saved to library`
          : "Upload succeeded but library could not be saved"
      );
    } catch (error) {
      console.error(error);
    } finally {
      setHeroUploading(false);
      e.target.value = "";
    }
  };

  const selectHeroImage = async (url: string) => {
    setFormData((prev) => ({ ...prev, heroImage: url }));
    const saved = await persistHeroLibrary(heroImages, url);
    if (saved) setSaveMessage("Live hero image updated");
  };

  const removeHeroImage = async (url: string) => {
    const next = heroImages.filter((u) => u !== url);
    const nextLive = formData.heroImage !== url ? formData.heroImage : (next[0] ?? "");
    setHeroImages(next);
    setFormData((fd) => ({ ...fd, heroImage: nextLive }));
    const saved = await persistHeroLibrary(next, nextLive);
    if (saved) setSaveMessage("Hero image removed from library");
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setSaveMessage("");

      const libraryToSave = mergeHeroLibrary(formData.heroImage, heroImages);

      const { error } = await supabase.from("homepage_content").upsert({
        id: "00000000-0000-0000-0000-000000000001",

        hero_title: formData.heroTitle,
        hero_description: formData.heroDescription,
        hero_image: formData.heroImage,
        hero_images: libraryToSave,

        welcome_title: formData.welcomeTitle,
        welcome_description: formData.welcomeDescription,
        logo: formData.logo,

        welcome_card_1_title: formData.welcomeCard1Title,
        welcome_card_1_subtitle: formData.welcomeCard1Subtitle,
        welcome_card_1_image: formData.welcomeCard1Image,

        welcome_card_2_title: formData.welcomeCard2Title,
        welcome_card_2_subtitle: formData.welcomeCard2Subtitle,
        welcome_card_2_image: formData.welcomeCard2Image,

        welcome_card_3_title: formData.welcomeCard3Title,
        welcome_card_3_subtitle: formData.welcomeCard3Subtitle,
        welcome_card_3_image: formData.welcomeCard3Image,

        welcome_card_4_title: formData.welcomeCard4Title,
        welcome_card_4_subtitle: formData.welcomeCard4Subtitle,
        welcome_card_4_image: formData.welcomeCard4Image,

        why_choose_1_title: formData.whyChoose1Title,
        why_choose_1_subtitle: formData.whyChoose1Subtitle,
        why_choose_1_image: formData.whyChoose1Image,

        why_choose_2_title: formData.whyChoose2Title,
        why_choose_2_subtitle: formData.whyChoose2Subtitle,
        why_choose_2_image: formData.whyChoose2Image,

        why_choose_3_title: formData.whyChoose3Title,
        why_choose_3_subtitle: formData.whyChoose3Subtitle,
        why_choose_3_image: formData.whyChoose3Image,

        why_choose_4_title: formData.whyChoose4Title,
        why_choose_4_subtitle: formData.whyChoose4Subtitle,
        why_choose_4_image: formData.whyChoose4Image,

        why_choose_5_title: formData.whyChoose5Title,
        why_choose_5_subtitle: formData.whyChoose5Subtitle,

        offering_1_title: formData.offering1Title,
        offering_1_subtitle: formData.offering1Subtitle,
        offering_1_image: formData.offering1Image,

        offering_2_title: formData.offering2Title,
        offering_2_subtitle: formData.offering2Subtitle,
        offering_2_image: formData.offering2Image,

        offering_3_title: formData.offering3Title,
        offering_3_subtitle: formData.offering3Subtitle,
        offering_3_image: formData.offering3Image,
      });

      if (error) { console.error(error); alert(error.message); return; }

      setSaveMessage("Homepage saved successfully");
      setHeroImages(libraryToSave);
      await loadHomepage();
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  // ── Sub-components ────────────────────────────────────────────────────────────
  const HeroImageManager = () => (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <label className="text-sm font-medium">Hero Image Library</label>
          <p className="text-sm text-muted-foreground mt-1">
            Upload multiple images. Click one to set it live on the homepage.
          </p>
        </div>
        <label className="h-10 px-4 rounded-2xl border inline-flex items-center gap-2 cursor-pointer hover:bg-muted transition-colors">
          {heroUploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
          <span className="text-sm">{heroUploading ? "Uploading…" : "Add images"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleHeroImagesUpload}
            disabled={heroUploading}
            className="hidden"
          />
        </label>
      </div>

      {formData.heroImage && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Live preview</p>
          <div className="relative">
            <img src={formData.heroImage} alt="Live hero" className="w-full h-64 object-cover rounded-2xl border" />
            <Badge className="absolute top-3 left-3">Live</Badge>
          </div>
        </div>
      )}

      {heroImages.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No hero images yet. Upload one or more to build your library.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {heroImages.map((url) => {
            const isLive = formData.heroImage === url;
            return (
              <div
                key={url}
                className={cn(
                  "group relative rounded-2xl overflow-hidden border-2 transition-colors",
                  isLive
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
              >
                <button
                  type="button"
                  onClick={() => selectHeroImage(url)}
                  className="block w-full text-left"
                  title={isLive ? "Currently live" : "Set as live hero image"}
                >
                  <img src={url} alt="Hero library" className="w-full h-32 object-cover" />
                </button>
                {isLive && <Badge className="absolute top-2 left-2 pointer-events-none">Live</Badge>}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeHeroImage(url)}
                  className="absolute top-2 right-2 size-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from library"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const UploadBox = ({ field, label }: { field: UploadField; label: string }) => (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>
      <label className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-muted/40 transition-colors">
        <ImagePlus className="size-8 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Click to upload image</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, field)}
          className="hidden"
        />
      </label>
      {(preview[field] || (formData as Record<string, string>)[field]) && (
        <div className="space-y-2">
          <img
            src={preview[field] || (formData as Record<string, string>)[field]}
            alt="Preview"
            className="w-full h-64 object-cover rounded-2xl border"
          />
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            Image uploaded
          </div>
        </div>
      )}
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 space-y-8">

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Homepage CMS</h1>
          <p className="text-muted-foreground mt-2">
            Manage homepage content, images and branding. All changes reflect live on the main site.
          </p>
        </div>
        {/* Quick link to live gallery manager */}
        <Link
          to="/admin/gallery"
          className="inline-flex items-center gap-2 shrink-0 h-10 px-4 rounded-xl border text-sm hover:bg-muted transition-colors"
        >
          <ExternalLink className="size-4" />
          Manage Gallery
        </Link>
      </div>

      {/* HERO */}
      <div className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="text-xl font-semibold">Hero Section</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <textarea
            name="heroTitle"
            value={formData.heroTitle}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border p-4 bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="heroDescription"
            value={formData.heroDescription}
            onChange={handleChange}
            rows={3}
            className="w-full rounded-xl border p-4 bg-background"
          />
        </div>
        <HeroImageManager />
      </div>

      {/* WELCOME */}
      <div className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="text-xl font-semibold">Welcome Section</h2>
        <div className="space-y-1">
          <label className="text-sm font-medium">Title</label>
          <input
            type="text"
            name="welcomeTitle"
            value={formData.welcomeTitle}
            onChange={handleChange}
            className="w-full h-12 rounded-xl border px-4 bg-background"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            name="welcomeDescription"
            value={formData.welcomeDescription}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border p-4 bg-background"
          />
        </div>
      </div>

      {/* WELCOME CARDS */}
      {([1, 2, 3, 4] as const).map((i) => (
        <div key={i} className="rounded-2xl border bg-background p-6 space-y-5">
          <h2 className="text-xl font-semibold">Welcome Card {i}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                name={`welcomeCard${i}Title`}
                value={(formData as Record<string, string>)[`welcomeCard${i}Title`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle</label>
              <input
                type="text"
                name={`welcomeCard${i}Subtitle`}
                value={(formData as Record<string, string>)[`welcomeCard${i}Subtitle`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
          </div>
          <UploadBox field={`welcomeCard${i}Image` as UploadField} label={`Card ${i} Image`} />
        </div>
      ))}

      {/* WHY CHOOSE — items 1–4 have slideshow images; item 5 is text only */}
      {([1, 2, 3, 4] as const).map((i) => (
        <div key={i} className="rounded-2xl border bg-background p-6 space-y-5">
          <h2 className="text-xl font-semibold">Why Choose — Slide {i}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                name={`whyChoose${i}Title`}
                value={(formData as Record<string, string>)[`whyChoose${i}Title`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle</label>
              <input
                type="text"
                name={`whyChoose${i}Subtitle`}
                value={(formData as Record<string, string>)[`whyChoose${i}Subtitle`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
          </div>
          <UploadBox field={`whyChoose${i}Image` as UploadField} label={`Slide ${i} Background Image`} />
        </div>
      ))}

      {/* Why Choose item 5 — text only, no slideshow image */}
      <div className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="text-xl font-semibold">Why Choose — Item 5</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              name="whyChoose5Title"
              value={formData.whyChoose5Title}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border px-4 bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Subtitle</label>
            <input
              type="text"
              name="whyChoose5Subtitle"
              value={formData.whyChoose5Subtitle}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border px-4 bg-background"
            />
          </div>
        </div>
      </div>

      {/* OFFERINGS */}
      {([1, 2, 3] as const).map((i) => (
        <div key={i} className="rounded-2xl border bg-background p-6 space-y-5">
          <h2 className="text-xl font-semibold">Offering {i}</h2>
          <div className="space-y-1">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              name={`offering${i}Title`}
              value={(formData as Record<string, string>)[`offering${i}Title`]}
              onChange={handleChange}
              className="w-full h-12 rounded-xl border px-4 bg-background"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Description</label>
            <textarea
              name={`offering${i}Subtitle`}
              value={(formData as Record<string, string>)[`offering${i}Subtitle`]}
              onChange={handleChange}
              rows={3}
              className="w-full rounded-xl border p-4 bg-background"
            />
          </div>
          <UploadBox field={`offering${i}Image` as UploadField} label={`Offering ${i} Image`} />
        </div>
      ))}

      {/* GALLERY — admin link, images are managed via GalleryManager */}
      <div className="rounded-2xl border bg-background p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Homepage Gallery Preview</h2>
            <p className="text-sm text-muted-foreground mt-1">
              The 9 most recent visible gallery images are shown automatically on the homepage.
              Use the Gallery Manager to upload, reorder, show/hide, and categorise images.
            </p>
          </div>
          <Link
            to="/admin/gallery"
            className="inline-flex items-center gap-2 shrink-0 h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm hover:bg-primary/90 transition-colors"
          >
            <ExternalLink className="size-4" />
            Open Gallery Manager
          </Link>
        </div>
      </div>

      {/* BRANDING */}
      <div className="rounded-2xl border bg-background p-6 space-y-5">
        <h2 className="text-xl font-semibold">Branding</h2>
        <UploadBox field="logo" label="Upload Logo" />
      </div>

      {/* SAVE */}
      <div className="flex flex-wrap items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="h-12 px-6 rounded-xl bg-primary text-primary-foreground font-medium flex items-center gap-2 disabled:opacity-70"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Saving…" : "Save Homepage"}
        </button>

        {saveMessage && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle2 className="size-4" />
            {saveMessage}
          </div>
        )}
      </div>
    </div>
  );
}