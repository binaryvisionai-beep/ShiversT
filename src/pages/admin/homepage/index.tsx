import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  Loader2,
  Save,
  Trash2,
  ExternalLink,
  X,
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
  | "welcomeCard4_0Image"
  | "welcomeCard4Image"
  | "offering1Image"
  | "offering2Image"
  | "offering3Image"
  | "whyChoose1Image"
  | "whyChoose2Image"
  | "whyChoose3Image"
  | "whyChoose4Image";

const UPLOAD_FIELD_COLUMNS: Record<UploadField, string> = {
  logo: "logo",
  welcomeCard1Image: "welcome_card_1_image",
  welcomeCard2Image: "welcome_card_2_image",
  welcomeCard3Image: "welcome_card_3_image",
  welcomeCard4_0Image: "welcome_card_4_0_image",
  welcomeCard4Image: "welcome_card_4_image",
  offering1Image: "offering_1_image",
  offering2Image: "offering_2_image",
  offering3Image: "offering_3_image",
  whyChoose1Image: "why_choose_1_image",
  whyChoose2Image: "why_choose_2_image",
  whyChoose3Image: "why_choose_3_image",
  whyChoose4Image: "why_choose_4_image",
};

const EMPTY_SAVED_IMAGES: Record<UploadField, string> = {
  logo: "",
  welcomeCard1Image: "",
  welcomeCard2Image: "",
  welcomeCard3Image: "",
  welcomeCard4_0Image: "",
  welcomeCard4Image: "",
  offering1Image: "",
  offering2Image: "",
  offering3Image: "",
  whyChoose1Image: "",
  whyChoose2Image: "",
  whyChoose3Image: "",
  whyChoose4Image: "",
};

function savedImagesFromFormData(formData: Record<string, string>): Record<UploadField, string> {
  return {
    logo: formData.logo || "",
    welcomeCard1Image: formData.welcomeCard1Image || "",
    welcomeCard2Image: formData.welcomeCard2Image || "",
    welcomeCard3Image: formData.welcomeCard3Image || "",
    welcomeCard4_0Image: formData.welcomeCard4_0Image || "",
    welcomeCard4Image: formData.welcomeCard4Image || "",
    offering1Image: formData.offering1Image || "",
    offering2Image: formData.offering2Image || "",
    offering3Image: formData.offering3Image || "",
    whyChoose1Image: formData.whyChoose1Image || "",
    whyChoose2Image: formData.whyChoose2Image || "",
    whyChoose3Image: formData.whyChoose3Image || "",
    whyChoose4Image: formData.whyChoose4Image || "",
  };
}

function savedImagesFromData(data: Record<string, unknown>): Record<UploadField, string> {
  return {
    logo: (data.logo as string) || "",
    welcomeCard1Image: (data.welcome_card_1_image as string) || "",
    welcomeCard2Image: (data.welcome_card_2_image as string) || "",
    welcomeCard3Image: (data.welcome_card_3_image as string) || "",
    welcomeCard4_0Image: (data.welcome_card_4_0_image as string) || "",
    welcomeCard4Image: (data.welcome_card_4_image as string) || "",
    offering1Image: (data.offering_1_image as string) || "",
    offering2Image: (data.offering_2_image as string) || "",
    offering3Image: (data.offering_3_image as string) || "",
    whyChoose1Image: (data.why_choose_1_image as string) || "",
    whyChoose2Image: (data.why_choose_2_image as string) || "",
    whyChoose3Image: (data.why_choose_3_image as string) || "",
    whyChoose4Image: (data.why_choose_4_image as string) || "",
  };
}

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

type ImageMeta = {
  fileName: string;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: string;
  megapixels: string;
  fileSize: string | null;
  format: string | null;
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function formatAspectRatio(width: number, height: number): string {
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  const decimal = (width / height).toFixed(2);
  if (w <= 20 && h <= 20) return `${w}:${h} (${decimal}:1)`;
  return `${decimal}:1`;
}

function getOrientation(width: number, height: number): string {
  if (width === height) return "Square";
  return width > height ? "Landscape" : "Portrait";
}

function getFileNameFromUrl(url: string): string {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || url);
  } catch {
    return url.split("/").pop() || url;
  }
}

function getFormatFromUrl(url: string): string | null {
  const name = getFileNameFromUrl(url).toLowerCase();
  const match = name.match(/\.(jpe?g|png|gif|webp|svg|avif|bmp)$/);
  return match ? match[1].toUpperCase() : null;
}

async function loadImageMeta(url: string): Promise<ImageMeta> {
  const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = url;
  });

  let fileSize: string | null = null;
  try {
    const res = await fetch(url, { method: "HEAD" });
    const len = res.headers.get("content-length");
    if (len) fileSize = formatFileSize(Number(len));
  } catch {
  }

  if (!fileSize) {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      fileSize = formatFileSize(blob.size);
    } catch {
    }
  }

  return {
    fileName: getFileNameFromUrl(url),
    width,
    height,
    aspectRatio: formatAspectRatio(width, height),
    orientation: getOrientation(width, height),
    megapixels: ((width * height) / 1_000_000).toFixed(2),
    fileSize,
    format: getFormatFromUrl(url),
  };
}

// ─── Welcome card sections (admin order) ─────────────────────────────────────
const WELCOME_CARD_SECTIONS = [
  { suffix: "1", label: "Welcome Card 1", uploadLabel: "Card 1 Image" },
  { suffix: "2", label: "Welcome Card 2", uploadLabel: "Card 2 Image" },
  { suffix: "3", label: "Welcome Card 3", uploadLabel: "Card 3 Image" },
  { suffix: "4_0", label: "Welcome Card 4.0", uploadLabel: "Card 4.0 Image" },
  { suffix: "4", label: "Welcome Card 4", uploadLabel: "Card 4 Image" },
] as const;

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

    welcomeCard4_0Title: "Romantic Dinner",
    welcomeCard4_0Subtitle: "An Evening Made for Two",
    welcomeCard4_0Image: "",

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
  const [viewingImage, setViewingImage] = useState<{ url: string; label: string } | null>(null);
  const [imageDetails, setImageDetails] = useState<{
    url: string;
    label: string;
    loading: boolean;
    meta: ImageMeta | null;
    error: string | null;
  } | null>(null);
  const [savedImages, setSavedImages] = useState<Record<UploadField, string>>(EMPTY_SAVED_IMAGES);
  const [savingImageField, setSavingImageField] = useState<UploadField | null>(null);

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

        welcomeCard4_0Title: data.welcome_card_4_0_title || prev.welcomeCard4_0Title,
        welcomeCard4_0Subtitle: data.welcome_card_4_0_subtitle || prev.welcomeCard4_0Subtitle,
        welcomeCard4_0Image: data.welcome_card_4_0_image || prev.welcomeCard4_0Image,

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
      setSavedImages(savedImagesFromData(data));
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
      setSaveMessage("Image uploaded — click Save to confirm this image.");
    } catch (error) {
      console.error(error);
    }
  };

  const handleImageRemove = (field: UploadField) => {
    setFormData((prev) => ({ ...prev, [field]: "" }));
    setPreview((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setSaveMessage("Image removed — click Save to confirm this image.");
  };

  const handleImageSave = async (field: UploadField, label: string) => {
    const column = UPLOAD_FIELD_COLUMNS[field];
    const value = formData[field];

    try {
      setSavingImageField(field);
      setSaveMessage("");

      const { error } = await supabase.from("homepage_content").upsert({
        id: "00000000-0000-0000-0000-000000000001",
        [column]: value,
      });

      if (error) {
        console.error(error);
        alert(error.message);
        return;
      }

      setSavedImages((prev) => ({ ...prev, [field]: value }));
      setPreview((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      setSaveMessage(`${label} saved successfully`);
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setSavingImageField(null);
    }
  };

  const openImageDetails = async (url: string, label: string) => {
    setImageDetails({ url, label, loading: true, meta: null, error: null });
    try {
      const meta = await loadImageMeta(url);
      setImageDetails({ url, label, loading: false, meta, error: null });
    } catch {
      setImageDetails({
        url,
        label,
        loading: false,
        meta: null,
        error: "Could not load image details.",
      });
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

        welcome_card_4_0_title: formData.welcomeCard4_0Title,
        welcome_card_4_0_subtitle: formData.welcomeCard4_0Subtitle,
        welcome_card_4_0_image: formData.welcomeCard4_0Image,

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
      setSavedImages(savedImagesFromFormData(formData));
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

  const UploadBox = ({ field, label }: { field: UploadField; label: string }) => {
    const currentValue = formData[field];
    const savedValue = savedImages[field];
    const hasUnsavedChanges = currentValue !== savedValue;
    const imageUrl = preview[field] || currentValue;
    const isSaving = savingImageField === field;

    return (
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
        {imageUrl && (
          <div className="space-y-2">
            <img
              src={imageUrl}
              alt="Preview"
              className="w-full h-64 object-cover rounded-2xl border"
            />
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewingImage({ url: imageUrl, label })}
              >
                <Eye className="size-4" />
                View
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void openImageDetails(imageUrl, label)}
              >
                <Info className="size-4" />
                Details
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => handleImageRemove(field)}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
              {hasUnsavedChanges && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void handleImageSave(field, label)}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  {isSaving ? "Saving…" : "Save"}
                </Button>
              )}
              {!hasUnsavedChanges && imageUrl && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="size-4" />
                  Image saved
                </div>
              )}
              {hasUnsavedChanges && (
                <span className="text-sm text-amber-600">Unsaved changes</span>
              )}
            </div>
          </div>
        )}
        {!imageUrl && hasUnsavedChanges && (
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-dashed p-4">
            <span className="text-sm text-muted-foreground">Image removed</span>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleImageSave(field, label)}
              disabled={isSaving}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {isSaving ? "Saving…" : "Save"}
            </Button>
            <span className="text-sm text-amber-600">Unsaved changes</span>
          </div>
        )}
      </div>
    );
  };

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
      {WELCOME_CARD_SECTIONS.map(({ suffix, label, uploadLabel }) => (
        <div key={suffix} className="rounded-2xl border bg-background p-6 space-y-5">
          <h2 className="text-xl font-semibold">{label}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium">Title</label>
              <input
                type="text"
                name={`welcomeCard${suffix}Title`}
                value={(formData as Record<string, string>)[`welcomeCard${suffix}Title`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Subtitle</label>
              <input
                type="text"
                name={`welcomeCard${suffix}Subtitle`}
                value={(formData as Record<string, string>)[`welcomeCard${suffix}Subtitle`]}
                onChange={handleChange}
                className="w-full h-12 rounded-xl border px-4 bg-background"
              />
            </div>
          </div>
          <UploadBox
            field={`welcomeCard${suffix}Image` as UploadField}
            label={uploadLabel}
          />
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

      {viewingImage && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-5xl rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">{viewingImage.label}</h2>
              <button
                type="button"
                onClick={() => setViewingImage(null)}
                className="size-10 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6">
              <img
                src={viewingImage.url}
                alt={viewingImage.label}
                className="w-full max-h-[70vh] object-contain rounded-2xl border"
              />
            </div>
          </div>
        </div>
      )}

      {imageDetails && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-lg rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Image Details</h2>
              <button
                type="button"
                onClick={() => setImageDetails(null)}
                className="size-10 rounded-xl border flex items-center justify-center"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <p className="text-sm text-muted-foreground">{imageDetails.label}</p>
                <img
                  src={imageDetails.url}
                  alt={imageDetails.label}
                  className="mt-3 w-full h-40 object-cover rounded-2xl border"
                />
              </div>

              {imageDetails.loading ? (
                <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  Loading details…
                </div>
              ) : imageDetails.error ? (
                <p className="text-sm text-destructive">{imageDetails.error}</p>
              ) : imageDetails.meta ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">File name</dt>
                    <dd className="font-medium break-all">{imageDetails.meta.fileName}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Format</dt>
                    <dd className="font-medium">{imageDetails.meta.format ?? "Unknown"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Dimensions</dt>
                    <dd className="font-medium">
                      {imageDetails.meta.width} × {imageDetails.meta.height} px
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Aspect ratio</dt>
                    <dd className="font-medium">{imageDetails.meta.aspectRatio}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Orientation</dt>
                    <dd className="font-medium">{imageDetails.meta.orientation}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="text-muted-foreground">Resolution</dt>
                    <dd className="font-medium">{imageDetails.meta.megapixels} MP</dd>
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <dt className="text-muted-foreground">File size</dt>
                    <dd className="font-medium">{imageDetails.meta.fileSize ?? "Unavailable"}</dd>
                  </div>
                </dl>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}