/** Set to false when wiring real auth (login, signup, route guards). */
export const AUTH_BYPASS = true;

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

export type AdminSession = {
  userId: string;
  name: string;
  email: string;
};

const USERS_KEY = "amber_admin_users";
const SESSION_KEY = "amber_admin_session";

function isBrowser() {
  return typeof window !== "undefined";
}

function readUsers(): AdminUser[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AdminUser[];
  } catch {
    return [];
  }
}

function writeUsers(users: AdminUser[]) {
  if (!isBrowser()) return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getSession(): AdminSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminSession;
  } catch {
    return null;
  }
}

export function setSession(session: AdminSession) {
  if (!isBrowser()) return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
}

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

export function signup(input: SignupInput): AuthResult {
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

  const users = readUsers();
  if (users.some((u) => u.email === email)) {
    return { ok: false, error: "An account with this email already exists." };
  }

  const user: AdminUser = {
    id: crypto.randomUUID(),
    name,
    email,
    password,
  };

  writeUsers([...users, user]);

  const session: AdminSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
  };
  setSession(session);
  return { ok: true, session };
}

export function login(input: LoginInput): AuthResult {
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!email) return { ok: false, error: "Please enter your email." };
  if (!password) return { ok: false, error: "Please enter your password." };

  const user = readUsers().find((u) => u.email === email);
  if (!user || user.password !== password) {
    return { ok: false, error: "Invalid email or password." };
  }

  const session: AdminSession = {
    userId: user.id,
    name: user.name,
    email: user.email,
  };
  setSession(session);
  return { ok: true, session };
}

export function logout() {
  clearSession();
}
