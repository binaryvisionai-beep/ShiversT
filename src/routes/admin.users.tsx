// import { createFileRoute } from "@tanstack/react-router";
// import { PlaceholderPage } from "@/components/admin/placeholder-page";

// export const Route = createFileRoute("/admin/users")({
//   component: () => (
//     <PlaceholderPage
//       title="Users"
//       description="Staff, concierge teams, and access controls."
//     />
//   ),
// });


import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  X,
  Mail,
  Plus,
  Shield,
  ShieldCheck,
  UserCog,
  Headset,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "owner" | "manager" | "staff" | "concierge";

type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  is_active: boolean;
  created_at: string;
};

const ROLE_META: Record<Role, { label: string; icon: React.ComponentType<{ className?: string }>; color: string; description: string }> = {
  owner:     { label: "Owner",     icon: ShieldCheck, color: "bg-gold/15 text-bronze border-gold/30",         description: "Full access to everything, including user management" },
  manager:   { label: "Manager",   icon: Shield,      color: "bg-primary/10 text-primary border-primary/20", description: "Manage bookings, content, and staff" },
  staff:     { label: "Staff",     icon: UserCog,     color: "bg-muted text-muted-foreground border-border", description: "Day-to-day operations - bookings, reservations, enquiries" },
  concierge: { label: "Concierge", icon: Headset,     color: "bg-blue-100 text-blue-700 border-blue-200",     description: "Guest-facing - view bookings and respond to enquiries" },
};

const ROLES: Role[] = ["owner", "manager", "staff", "concierge"];

// ─── Invite Modal ───────────────────────────────────────────────────────────────
function InviteModal({
  open,
  onClose,
  onInvited,
}: {
  open: boolean;
  onClose: () => void;
  onInvited: () => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("staff");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    setSending(true);
    setError("");
    try {
      // Invite via Supabase Auth (sends magic-link email)
      const { data, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email.trim(), {
        data: { name: name.trim() || email.trim() },
      });
      if (inviteErr) throw inviteErr;

      // Set their role in admin_users (the trigger creates the row with default 'staff')
      if (data?.user?.id) {
        await supabase.from("admin_users").update({
          role,
          name: name.trim() || email.trim(),
        }).eq("id", data.user.id);
      }

      onInvited();
      onClose();
      setEmail(""); setName(""); setRole("staff");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invite. Admin invite requires a service-role key - see note below.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-background border max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-background border-b p-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Invite Team Member</h2>
              <button onClick={onClose} className="size-9 rounded-xl border flex items-center justify-center hover:bg-muted transition-colors">
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Full Name</label>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="e.g. Anjali Rodrigues"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Email Address *</label>
                <input
                  type="email"
                  required
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background"
                  placeholder="name@goashivers.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => {
                    const meta = ROLE_META[r];
                    const Icon = meta.icon;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all ${
                          role === r ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:bg-muted/50"
                        }`}
                      >
                        <Icon className="size-4" />
                        <span className="text-sm font-medium">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-2">{ROLE_META[role].description}</p>
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 leading-relaxed">
                  {error}
                  <p className="mt-1 text-red-500">
                    Note: sending invites requires the Supabase service-role key configured server-side
                    (Edge Function). Alternatively, add the user manually via Supabase Auth dashboard, then
                    set their role here.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                {sending ? "Sending invite..." : "Send Invite"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
function UsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [message, setMessage] = useState("");

  const notify = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_users")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) console.error(error);
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { void loadUsers(); }, []);

  const updateRole = async (id: string, role: Role) => {
    const { error } = await supabase.from("admin_users").update({ role }).eq("id", id);
    if (error) { notify("Failed to update role"); return; }
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, role } : u));
    notify("Role updated");
  };

  const toggleActive = async (user: AdminUser) => {
    const { error } = await supabase.from("admin_users").update({ is_active: !user.is_active }).eq("id", user.id);
    if (error) { notify("Failed to update"); return; }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u));
    notify(user.is_active ? "User deactivated" : "User activated");
  };

  const removeUser = async (id: string) => {
    if (!confirm("Remove this user's admin access? This does not delete their auth account.")) return;
    const { error } = await supabase.from("admin_users").delete().eq("id", id);
    if (error) { notify("Failed to remove user"); return; }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    notify("User removed");
  };

  const filtered = users.filter((u) => {
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    owners: users.filter((u) => u.role === "owner").length,
  };

  const initials = (name: string) =>
    name.split(" ").filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">System</p>
          <h1 className="text-3xl font-semibold mt-1">Users</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Staff, concierge teams, and access controls for the admin panel.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {message && (
            <div className="flex items-center gap-2 text-sm text-green-600 shrink-0">
              <CheckCircle2 className="size-4" /> {message}
            </div>
          )}
          <button
            onClick={() => setInviteOpen(true)}
            className="h-10 px-4 rounded-2xl bg-primary text-primary-foreground inline-flex items-center gap-2 text-sm font-medium shrink-0"
          >
            <Plus className="size-4" /> Invite User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Users",  value: stats.total,  icon: UserCog     },
          { label: "Active",       value: stats.active, icon: ToggleRight },
          { label: "Owners",       value: stats.owners, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="font-display text-3xl mt-2">{value}</p>
              </div>
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center">
                <Icon className="size-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative w-full sm:w-60">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setRoleFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              roleFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
            }`}
          >
            All
          </button>
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                roleFilter === r ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {ROLE_META[r].label}
            </button>
          ))}
        </div>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4">
          <Loader2 className="size-4 animate-spin" /> Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground text-sm">
            {users.length === 0 ? "No admin users yet. Invite your first team member." : "No users match your filters."}
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Joined</th>
                  <th className="px-4 py-3 font-medium w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/60 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-gradient-gold flex items-center justify-center text-xs font-semibold text-coffee shrink-0">
                          {initials(u.name || u.email)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.name || "—"}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                          {u.id === session?.userId && (
                            <span className="text-[10px] text-primary font-medium">You</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={u.role}
                        onChange={(e) => updateRole(u.id, e.target.value as Role)}
                        disabled={u.id === session?.userId}
                        className={`text-xs rounded-full px-2.5 py-1 border font-medium focus:outline-none cursor-pointer ${ROLE_META[u.role].color} disabled:opacity-60 disabled:cursor-not-allowed`}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{ROLE_META[r].label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(u)}
                        disabled={u.id === session?.userId}
                        className="inline-flex items-center gap-1.5 text-xs disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {u.is_active
                          ? <ToggleRight className="size-4 text-primary" />
                          : <ToggleLeft className="size-4 text-muted-foreground" />}
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => removeUser(u.id)}
                        disabled={u.id === session?.userId}
                        className="size-8 rounded-lg border flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="size-3.5 text-red-500" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-border">
            {filtered.map((u) => (
              <div key={u.id} className="p-4 space-y-2.5">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gradient-gold flex items-center justify-center text-sm font-semibold text-coffee shrink-0">
                    {initials(u.name || u.email)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{u.name || "—"}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                  {u.id === session?.userId && (
                    <span className="text-[10px] text-primary font-medium shrink-0">You</span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    disabled={u.id === session?.userId}
                    className={`text-xs rounded-full px-2.5 py-1 border font-medium focus:outline-none ${ROLE_META[u.role].color} disabled:opacity-60`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_META[r].label}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={u.id === session?.userId}
                    className="inline-flex items-center gap-1.5 text-xs disabled:opacity-60"
                  >
                    {u.is_active
                      ? <ToggleRight className="size-4 text-primary" />
                      : <ToggleLeft className="size-4 text-muted-foreground" />}
                    {u.is_active ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => removeUser(u.id)}
                    disabled={u.id === session?.userId}
                    className="ml-auto size-8 rounded-lg border flex items-center justify-center disabled:opacity-40"
                  >
                    <Trash2 className="size-3.5 text-red-500" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Joined {new Date(u.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <InviteModal open={inviteOpen} onClose={() => setInviteOpen(false)} onInvited={() => void loadUsers()} />
    </div>
  );
}

