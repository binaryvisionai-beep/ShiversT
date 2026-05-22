import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Trash2,
  Pencil,
  Loader2,
  CheckCircle2,
  ImagePlus,
  BedDouble,
  IndianRupee,
  Eye,
  BarChart3,
  Upload,
  ChevronDown,
  X,
  Users,
  Maximize2,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Room = {
  id: string;
  slug: string;
  category: string;
  name: string;
  short_summary: string;
  description: string;
  guests: string;
  bed_type: string;
  room_size: string;
  price_from: string;
  seasonal_pricing: string;
  offer_label: string;
  package_label: string;
  check_in: string;
  check_out: string;
  policies: string;
  amenities: string[];
  booking_url: string;
  meta_title: string;
  meta_description: string;
  keywords: string;
  og_image: string;
  room_order: number;
  is_active: boolean;
};

type Analytics = {
  id: string;
  room_name: string;
  category: string;
  cta: string;
  created_at: string;
};

const emptyRoom: Room = {
  id: "",
  slug: "",
  category: "Deluxe",
  name: "",
  short_summary: "",
  description: "",
  guests: "",
  bed_type: "",
  room_size: "",
  price_from: "",
  seasonal_pricing: "",
  offer_label: "",
  package_label: "",
  check_in: "",
  check_out: "",
  policies: "",
  amenities: [],
  booking_url: "",
  meta_title: "",
  meta_description: "",
  keywords: "",
  og_image: "",
  room_order: 0,
  is_active: true,
};

export default function RoomsAdminPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [analytics, setAnalytics] = useState<Analytics[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editing, setEditing] = useState<Room | null>(null);
  const [viewing, setViewing] = useState<Room | null>(null);

  const [message, setMessage] = useState("");

  const [preview, setPreview] = useState("");

  const [showEditor, setShowEditor] = useState(false);

  const totalBookings = useMemo(() => analytics.length, [analytics]);

  useEffect(() => {
    loadRooms();
    loadAnalytics();
  }, []);

  const loadRooms = async () => {
    try {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .order("room_order", { ascending: true });

      if (error) {
        console.error(error);
        return;
      }

      setRooms(data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from("room_booking_clicks")
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
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!editing) return;

    setEditing({
      ...editing,
      [e.target.name]:
        e.target.name === "is_active"
          ? e.target.value === "true"
          : e.target.value,
    });
  };

  const handleAmenities = (value: string) => {
    if (!editing) return;

    setEditing({
      ...editing,
      amenities: value
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
    });
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file || !editing) return;

    try {
      setMessage("");

      const localPreview = URL.createObjectURL(file);

      setPreview(localPreview);

      const fileName = `${Date.now()}-${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from("rooms")
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert("Upload failed");
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("rooms").getPublicUrl(fileName);

      setPreview(publicUrl);

      setEditing({
        ...editing,
        og_image: publicUrl,
      });

      setMessage("Image uploaded successfully");
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddRoom = () => {
    setEditing(emptyRoom);
    setPreview("");
    setShowEditor(true);
  };

  const handleEditRoom = (room: Room) => {
    setEditing(room);
    setPreview(room.og_image || "");
    setShowEditor(true);
  };

 


  const handleSave = async () => {
    if (!editing) return;
  
    try {
      setSaving(true);
      setMessage("");
  
      const slug =
        editing.slug ||
        editing.name.toLowerCase().replace(/\s+/g, "-");
  
      const isNew = !editing.id;
  
      let error;
  
      if (isNew) {
        const payload = {
          ...editing,
          id: undefined,
          slug,
        };
        ({ error } = await supabase.from("rooms").insert(payload));
      } else {
        const payload = {
          ...editing,
          slug,
        };
        ({ error } = await supabase
          .from("rooms")
          .update(payload)
          .eq("id", editing.id));
      }
  
      if (error) {
        console.error(error);
        alert("Failed to save room");
        return;
      }
  
      setMessage("Room saved successfully");
      setShowEditor(false);
      loadRooms();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };





  const handleDelete = async (id: string) => {
    const confirmDelete = confirm(
      "Are you sure you want to delete this room?"
    );

    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from("rooms")
        .delete()
        .eq("id", id);

      if (error) {
        console.error(error);
        alert("Failed to delete");
        return;
      }

      loadRooms();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-semibold">
            Rooms Management
          </h1>

          <p className="text-muted-foreground mt-2">
            Manage room categories, pricing, media, SEO,
            analytics and room content.
          </p>
        </div>

        <button
          onClick={handleAddRoom}
          className="h-12 px-5 rounded-2xl bg-primary text-primary-foreground font-medium inline-flex items-center gap-2 shadow-sm"
        >
          <Plus className="size-4" />
          Add New Room
        </button>
      </div>

      {/* ANALYTICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-3xl border bg-background p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                Total Rooms
              </p>

              <h2 className="text-3xl font-semibold mt-2">
                {rooms.length}
              </h2>
            </div>

            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <BedDouble className="size-6" />
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
                {totalBookings}
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
                Active Rooms
              </p>

              <h2 className="text-3xl font-semibold mt-2">
                {rooms.filter((r) => r.is_active).length}
              </h2>
            </div>

            <div className="size-14 rounded-2xl bg-muted flex items-center justify-center">
              <Eye className="size-6" />
            </div>
          </div>
        </div>
      </div>

      {/* ANALYTICS TABLE */}
      <div className="rounded-3xl border bg-background p-6 space-y-6">
        <div>
          <h2 className="text-xl font-semibold">
            Booking Analytics
          </h2>

          <p className="text-sm text-muted-foreground mt-1">
            Track room booking interactions.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-4 font-medium">
                  Room
                </th>

                <th className="text-left px-4 py-4 font-medium">
                  Category
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
                    {a.room_name}
                  </td>

                  <td className="px-4 py-4">
                    {a.category}
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

      {/* ROOMS */}
      <div className="rounded-3xl border bg-background p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">
              Existing Rooms
            </h2>

            <p className="text-sm text-muted-foreground mt-1">
              Add, edit, delete and manage rooms displayed
              on the main Shivers Rooms page.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Loading rooms...
          </div>
        ) : (
          <div className="space-y-5">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="rounded-3xl border overflow-hidden bg-background"
              >
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr]">
                  <div className="h-full">
                    <img
                      src={room.og_image}
                      alt={room.name}
                      className="w-full h-full object-cover min-h-[260px]"
                    />
                  </div>

                  <div className="p-6 flex flex-col justify-between gap-5">
                    <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="text-2xl font-semibold">
                              {room.name}
                            </h3>

                            <span className="px-3 py-1 rounded-full bg-muted text-xs font-medium">
                              {room.category}
                            </span>

                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                room.is_active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {room.is_active
                                ? "Active"
                                : "Inactive"}
                            </span>
                          </div>

                          <p className="text-muted-foreground mt-3 leading-relaxed">
                            {room.short_summary}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-5 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="size-4 text-primary" />
                            {room.guests}
                          </div>

                          <div className="flex items-center gap-2">
                            <BedDouble className="size-4 text-primary" />
                            {room.bed_type}
                          </div>

                          <div className="flex items-center gap-2">
                            <Maximize2 className="size-4 text-primary" />
                            {room.room_size}
                          </div>

                          <div className="flex items-center gap-2">
                            <IndianRupee className="size-4 text-primary" />
                            {room.price_from}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {room.amenities?.map((a) => (
                            <span
                              key={a}
                              className="px-3 py-1 rounded-full bg-muted text-xs"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setViewing(room)}
                          className="size-11 rounded-2xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Eye className="size-4" />
                        </button>

                        <button
                          onClick={() => handleEditRoom(room)}
                          className="size-11 rounded-2xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Pencil className="size-4" />
                        </button>

                        <button
                          onClick={() => handleDelete(room.id)}
                          className="size-11 rounded-2xl border flex items-center justify-center hover:bg-muted transition-colors"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </button>
                      </div>
                    </div>

                    {room.booking_url && (
                      <a
                        href={room.booking_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-primary font-medium"
                      >
                        Open Booking Link
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-4xl rounded-3xl bg-background border max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Room Details
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
                src={viewing.og_image}
                alt={viewing.name}
                className="w-full h-[320px] object-cover rounded-3xl border"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Room Name
                  </p>
                  <h3 className="text-xl font-semibold mt-2">
                    {viewing.name}
                  </h3>
                </div>

                <div className="rounded-2xl border p-5">
                  <p className="text-sm text-muted-foreground">
                    Category
                  </p>
                  <h3 className="text-xl font-semibold mt-2">
                    {viewing.category}
                  </h3>
                </div>
              </div>

              <div className="rounded-2xl border p-5">
                <p className="text-sm text-muted-foreground mb-2">
                  Description
                </p>

                <p className="leading-relaxed text-muted-foreground">
                  {viewing.description}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDITOR MODAL */}
      {showEditor && editing && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="w-full max-w-7xl rounded-3xl bg-background border max-h-[94vh] overflow-y-auto">
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold">
                  {editing.id
                    ? "Edit Room"
                    : "Add New Room"}
                </h2>

                <p className="text-sm text-muted-foreground mt-1">
                  Changes here will reflect on the main
                  Shivers Rooms page.
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
  {/* LEFT COLUMN */}
  <div className="space-y-5">
    <div className="space-y-2">
      <label className="text-sm font-medium">Room Name</label>
      <input
        type="text"
        name="name"
        value={editing.name}
        onChange={handleChange}
        placeholder="e.g. The Banyan"
        className="w-full h-12 rounded-2xl border px-4 bg-background"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <div className="relative">
          <select
            name="category"
            value={editing.category}
            onChange={handleChange}
            className="w-full h-12 rounded-2xl border px-4 bg-background appearance-none"
          >
            <option>Deluxe</option>
            <option>Super Deluxe</option>
            <option>Suites</option>
          </select>
          <ChevronDown className="size-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Status</label>
        <div className="relative">
          <select
            name="is_active"
            value={String(editing.is_active)}
            onChange={handleChange}
            className="w-full h-12 rounded-2xl border px-4 bg-background appearance-none"
          >
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <ChevronDown className="size-4 absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">
        Tagline
        <span className="text-muted-foreground font-normal ml-2 text-xs">shown in italic below room name</span>
      </label>
      <input
        type="text"
        name="short_summary"
        value={editing.short_summary}
        onChange={handleChange}
        placeholder="e.g. Ancient · Majestic · Rooted"
        className="w-full h-12 rounded-2xl border px-4 bg-background"
      />
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">
        Room Story
        <span className="text-muted-foreground font-normal ml-2 text-xs">paragraph shown on the room card</span>
      </label>
      <textarea
        rows={6}
        name="description"
        value={editing.description}
        onChange={handleChange}
        placeholder="Write the room's story..."
        className="w-full rounded-2xl border p-4 bg-background resize-none"
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Guests</label>
        <input
          type="text"
          name="guests"
          value={editing.guests}
          onChange={handleChange}
          placeholder="2 Guests"
          className="w-full h-12 rounded-2xl border px-4 bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Bed Type</label>
        <input
          type="text"
          name="bed_type"
          value={editing.bed_type}
          onChange={handleChange}
          placeholder="1 King Bed"
          className="w-full h-12 rounded-2xl border px-4 bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Room Size</label>
        <input
          type="text"
          name="room_size"
          value={editing.room_size}
          onChange={handleChange}
          placeholder="350 sq ft"
          className="w-full h-12 rounded-2xl border px-4 bg-background"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Starting Price</label>
        <input
          type="text"
          name="price_from"
          value={editing.price_from}
          onChange={handleChange}
          placeholder="₹4,500"
          className="w-full h-12 rounded-2xl border px-4 bg-background"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Display Order</label>
        <input
          type="number"
          name="room_order"
          value={editing.room_order}
          onChange={handleChange}
          placeholder="1"
          className="w-full h-12 rounded-2xl border px-4 bg-background"
        />
      </div>
    </div>

    <div className="space-y-2">
      <label className="text-sm font-medium">Booking URL</label>
      <input
        type="text"
        name="booking_url"
        value={editing.booking_url}
        onChange={handleChange}
        placeholder="https://be.aiosell.com/book/..."
        className="w-full h-12 rounded-2xl border px-4 bg-background"
      />
    </div>
  </div>

  {/* RIGHT COLUMN — IMAGE */}
  <div className="space-y-5">
    <div className="space-y-2">
      <label className="text-sm font-medium">Room Image</label>
      <label className="border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-muted/40 transition-colors">
        <ImagePlus className="size-10 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Click to upload image</span>
        <div className="inline-flex items-center gap-2 text-sm font-medium">
          <Upload className="size-4" />
          Upload Image
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </label>

      {(preview || editing.og_image) && (
        <img
          src={preview || editing.og_image}
          alt="Preview"
          className="w-full h-72 object-cover rounded-3xl border"
        />
      )}
    </div>
{/* Live Preview Card */}
{(editing.name || editing.short_summary) && (
      <div className="rounded-2xl border p-5 space-y-3 bg-muted/20">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Live Preview</p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-lg">{editing.name || "Room Name"}</p>
          <span className="text-xs uppercase tracking-widest text-muted-foreground">{editing.category}</span>
        </div>
        <p className="text-sm italic text-muted-foreground">{editing.short_summary || "Tagline"}</p>
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          {editing.guests && <span> {editing.guests}</span>}
          {editing.bed_type && <span> {editing.bed_type}</span>}
          {editing.room_size && <span> {editing.room_size}</span>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-3">{editing.description}</p>
        {editing.price_from && (
          <p className="text-sm font-semibold">From {editing.price_from} <span className="font-normal text-muted-foreground">/Night</span></p>
        )}
      </div>
    )}
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
      {saving && <Loader2 className="size-4 animate-spin" />}
      {saving ? "Saving..." : editing.id ? "Update Room" : "Create Room"}
    </button>
  </div>
</div>

          </div>
        </div>
      )}
    </div>
  );
}