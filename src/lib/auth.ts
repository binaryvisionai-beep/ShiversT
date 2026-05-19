import type { AuthError } from "@supabase/supabase-js";

import { supabase } from "@/lib/supabase";

/** Set to false when wiring real auth (login, signup, route guards). */
export const AUTH_BYPASS = false;

export type AdminSession = {
  userId: string;
  name: string;
  email: string;
};

export type SignupInput = {
  name: string;
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult =
  | { ok: true; session: AdminSession }
  | { ok: false; error: string };

type AdminAuthRow = {
  id: string;
  name: string;
  email: string;
};

function isBrowser() {
  return typeof window !== "undefined";
}

function mapAuthError(error: AuthError | null): string {
  if (!error) return "Something went wrong. Please try again.";

  const msg = error.message.toLowerCase();

  if (msg.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (msg.includes("user already registered")) {
    return "An account with this email already exists.";
  }
  if (msg.includes("email not confirmed")) {
    return "Please confirm your email before signing in.";
  }
  if (msg.includes("password")) {
    return error.message;
  }

  return error.message;
}

function toSession(row: AdminAuthRow): AdminSession {
  return {
    userId: row.id,
    name: row.name,
    email: row.email,
  };
}

async function fetchAdminProfile(userId: string): Promise<AdminSession | null> {
  const { data, error } = await supabase
    .from("adminauth")
    .select("id, name, email")
    .eq("id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return toSession(data as AdminAuthRow);
}

export async function getSession(): Promise<AdminSession | null> {
  if (!isBrowser()) return null;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;
  return fetchAdminProfile(session.user.id);
}

export async function signup(input: SignupInput): Promise<AuthResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!name) return { ok: false, error: "Please enter your name." };
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });

  if (error) return { ok: false, error: mapAuthError(error) };
  if (!data.user) {
    return { ok: false, error: "Could not create account. Please try again." };
  }

  if (!data.session) {
    return {
      ok: false,
      error: "Account created. Please check your email to confirm before signing in.",
    };
  }

  const session = await fetchAdminProfile(data.user.id);
  if (!session) {
    const { error: profileError } = await supabase.from("adminauth").insert({
      id: data.user.id,
      name,
      email,
    });

    if (profileError) {
      return { ok: false, error: "Could not create admin profile. Please try again." };
    }

    await supabase.from("adminsignup").insert({
      admin_id: data.user.id,
      email,
    });

    const retry = await fetchAdminProfile(data.user.id);
    if (!retry) {
      return { ok: false, error: "Account created but profile could not be loaded." };
    }
    return { ok: true, session: retry };
  }

  return { ok: true, session };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email) return { ok: false, error: "Please enter your email." };
  if (!password) return { ok: false, error: "Please enter your password." };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return { ok: false, error: mapAuthError(error) };
  }

  const session = await fetchAdminProfile(data.user.id);
  if (!session) {
    await supabase.auth.signOut();
    return { ok: false, error: "Not an admin account." };
  }

  await supabase.from("adminlogin").insert({
    admin_id: session.userId,
    email: session.email,
  });

  return { ok: true, session };
}

export async function logout(): Promise<void> {
  if (!isBrowser()) return;
  await supabase.auth.signOut();
}
