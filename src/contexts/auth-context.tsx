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

type AuthContextValue = {
  session: AdminSession | null;
  isLoading: boolean;
  login: (input: LoginInput) => ReturnType<typeof authLogin>;
  signup: (input: SignupInput) => ReturnType<typeof authSignup>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(getSession());
    setIsLoading(false);
  }, []);

  const login = useCallback((input: LoginInput) => {
    const result = authLogin(input);
    if (result.ok) setSession(result.session);
    return result;
  }, []);

  const signup = useCallback((input: SignupInput) => {
    const result = authSignup(input);
    if (result.ok) setSession(result.session);
    return result;
  }, []);

  const logout = useCallback(() => {
    authLogout();
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
