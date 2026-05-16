import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Lock, Mail, Shield, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/contexts/auth-context";
import { AUTH_BYPASS } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type AuthTab = "login" | "signup";

const fadeSlide = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

export function AdminAuthPage() {
  const navigate = useNavigate();
  const { session, isLoading, login, signup } = useAuth();
  const [tab, setTab] = useState<AuthTab>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  useEffect(() => {
    if (AUTH_BYPASS) return;
    if (!isLoading && session) {
      navigate({ to: "/admin", replace: true });
    }
  }, [isLoading, session, navigate]);

  if (!AUTH_BYPASS && (isLoading || session)) {
    return <AuthPageSkeleton />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 400));
    if (AUTH_BYPASS) {
      setSubmitting(false);
      toast.success("Welcome back", { description: "Preview mode — auth not enforced yet." });
      navigate({ to: "/admin" });
      return;
    }
    const result = login({ email: loginEmail, password: loginPassword });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Welcome back", { description: `Signed in as ${result.session.name}` });
      navigate({ to: "/admin", replace: true });
    } else {
      toast.error(result.error);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 450));
    if (AUTH_BYPASS) {
      setSubmitting(false);
      toast.success("Account created", { description: "Preview mode — auth not enforced yet." });
      navigate({ to: "/admin" });
      return;
    }
    const result = signup({
      name: signupName,
      email: signupEmail,
      password: signupPassword,
    });
    setSubmitting(false);
    if (result.ok) {
      toast.success("Account created", { description: "Taking you to the admin panel…" });
      navigate({ to: "/admin", replace: true });
    } else {
      toast.error(result.error);
    }
  };

  const switchToSignup = () => {
    setSignupEmail(loginEmail);
    setTab("signup");
  };

  const switchToLogin = () => {
    setLoginEmail(signupEmail);
    setTab("login");
  };

  return (
    <motion.div
      className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <AmbientBackground />

      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="border-border/80 shadow-lift backdrop-blur-sm bg-card/95">
          <CardHeader className="text-center pb-2">
            <motion.div
              className="mx-auto size-14 rounded-2xl bg-gradient-amber flex items-center justify-center shadow-glow mb-2"
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 18 }}
            >
              <Shield className="size-7 text-primary-foreground" />
            </motion.div>
            <motion.div
              className="flex flex-col items-center leading-tight mt-1"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.35 }}
            >
              <span className="font-display text-3xl tracking-wide">Shivers</span>
            </motion.div>
            <CardTitle className="font-display text-xl tracking-tight mt-4">
              Shivers Admin Panel
            </CardTitle>
            <CardDescription>Sign in or create an account to manage your estate</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs
              value={tab}
              onValueChange={(v) => setTab(v as AuthTab)}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl p-1 mb-6">
                <TabsTrigger value="login" className="rounded-lg text-sm">
                  Log in
                </TabsTrigger>
                <TabsTrigger value="signup" className="rounded-lg text-sm">
                  Sign up
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-0">
                <motion.form
                  key="login-form"
                  onSubmit={handleLogin}
                  className="space-y-4"
                  {...fadeSlide}
                >
                      <AuthField
                        id="login-email"
                        label="Email"
                        icon={<Mail className="size-4" />}
                        type="email"
                        autoComplete="email"
                        placeholder="you@estate.com"
                        value={loginEmail}
                        onChange={setLoginEmail}
                        disabled={submitting}
                      />
                      <AuthField
                        id="login-password"
                        label="Password"
                        icon={<Lock className="size-4" />}
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={setLoginPassword}
                        disabled={submitting}
                        trailing={
                          <PasswordToggle
                            show={showPassword}
                            onToggle={() => setShowPassword((s) => !s)}
                          />
                        }
                      />
                      <SubmitButton loading={submitting} label="Log in" />
                      <p className="text-center text-sm text-muted-foreground pt-1">
                        New here?{" "}
                        <button
                          type="button"
                          onClick={switchToSignup}
                          className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
                        >
                          Create an account
                        </button>
                      </p>
                </motion.form>
              </TabsContent>

              <TabsContent value="signup" className="mt-0">
                <motion.form
                  key="signup-form"
                  onSubmit={handleSignup}
                  className="space-y-4"
                  {...fadeSlide}
                >
                      <AuthField
                        id="signup-name"
                        label="Name"
                        icon={<User className="size-4" />}
                        type="text"
                        autoComplete="name"
                        placeholder="Your full name"
                        value={signupName}
                        onChange={setSignupName}
                        disabled={submitting}
                      />
                      <AuthField
                        id="signup-email"
                        label="Email"
                        icon={<Mail className="size-4" />}
                        type="email"
                        autoComplete="email"
                        placeholder="you@estate.com"
                        value={signupEmail}
                        onChange={setSignupEmail}
                        disabled={submitting}
                      />
                      <AuthField
                        id="signup-password"
                        label="Password"
                        icon={<Lock className="size-4" />}
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        value={signupPassword}
                        onChange={setSignupPassword}
                        disabled={submitting}
                        trailing={
                          <PasswordToggle
                            show={showPassword}
                            onToggle={() => setShowPassword((s) => !s)}
                          />
                        }
                      />
                      <SubmitButton loading={submitting} label="Create account" />
                      <p className="text-center text-sm text-muted-foreground pt-1">
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={switchToLogin}
                          className="text-primary font-medium hover:underline underline-offset-4 transition-colors"
                        >
                          Log in
                        </button>
                      </p>
                </motion.form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

function AuthField({
  id,
  label,
  icon,
  trailing,
  className,
  onChange,
  ...props
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  className?: string;
  onChange: (value: string) => void;
} & Omit<React.ComponentProps<typeof Input>, "onChange">) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <motion.div className="relative group" whileFocus={{ scale: 1.005 }}>
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none transition-colors group-focus-within:text-primary">
          {icon}
        </span>
        <Input
          id={id}
          className={cn("h-11 pl-10 rounded-xl", trailing && "pr-10")}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        {trailing && (
          <motion.div
            className="absolute right-1 top-1/2 -translate-y-1/2"
            initial={false}
            animate={{ opacity: 1 }}
          >
            {trailing}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

function PasswordToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="size-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <motion.div whileTap={{ scale: loading ? 1 : 0.98 }} className="pt-1">
      <Button
        type="submit"
        disabled={loading}
        className="w-full h-11 rounded-xl bg-gradient-amber border-0 text-primary-foreground font-medium shadow-glow hover:opacity-95 transition-opacity"
      >
        {loading ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Please wait…
          </>
        ) : (
          label
        )}
      </Button>
    </motion.div>
  );
}

function AmbientBackground() {
  return (
    <motion.div
      className="pointer-events-none absolute inset-0"
      aria-hidden
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <motion.div
        className="absolute -top-32 -right-24 size-80 rounded-full bg-primary/10 blur-3xl"
        animate={{ x: [0, 20, 0], y: [0, -15, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-24 -left-20 size-72 rounded-full bg-gold/15 blur-3xl"
        animate={{ x: [0, -18, 0], y: [0, 12, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,var(--background)_70%)]" />
    </motion.div>
  );
}

function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        className="flex flex-col items-center gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="size-14 rounded-2xl bg-muted animate-pulse" />
        <div className="h-4 w-32 rounded-md bg-muted animate-pulse" />
      </motion.div>
    </div>
  );
}
