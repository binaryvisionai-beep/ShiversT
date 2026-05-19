import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getSession,
  login as authLogin,
  logout as authLogout,
  signup as authSignup,
  type AdminSession,
  type LoginInput,
  type SignupInput,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";

type AuthContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => ReturnType<typeof authLogin>;
  signup: (input: SignupInput) => ReturnType<typeof authSignup>;
  logout: () => ReturnType<typeof authLogout>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const current = await getSession();
      if (mounted) setSession(current);
      if (mounted) setIsLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void (async () => {
        const current = await getSession();
        if (mounted) setSession(current);
        if (mounted) setIsLoading(false);
      })();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    const result = await authLogin(input);
    if (result.ok) setSession(result.session);
    return result;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await authSignup(input);
    if (result.ok) setSession(result.session);
    return result;
  }, []);

  const logout = useCallback(async () => {
    await authLogout();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, isLoading, login, signup, logout }),
    [session, isLoading, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
