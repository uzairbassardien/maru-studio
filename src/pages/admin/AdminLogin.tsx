import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAuth } from "@/context/AdminAuthContext";

interface LoginLocationState {
  from?: string;
  denied?: boolean;
}

const AdminLogin = () => {
  const { session, isAdmin, isLoading, refreshAdminStatus, signOut } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state as LoginLocationState | null) ?? {};
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(
    state.denied ? "This account does not have administrator access." : "",
  );

  if (!isLoading && session && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) throw signInError;

      const authorized = await refreshAdminStatus();
      if (!authorized) {
        await signOut();
        setError("This account does not have administrator access.");
        return;
      }

      navigate(state.from?.startsWith("/admin") ? state.from : "/admin", {
        replace: true,
      });
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to sign in.";
      setError(message === "Invalid login credentials" ? "Incorrect email or password." : message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-white lg:grid-cols-2">
      <div className="hidden bg-black p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <p className="font-serif text-3xl uppercase tracking-[0.18em]">Maru by Maru</p>
        <div className="max-w-lg">
          <p className="font-serif text-6xl font-light leading-[0.95]">
            A quiet space to shape the collection.
          </p>
          <p className="mt-8 text-xs uppercase tracking-[0.25em] text-white/55">
            Product administration
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">
          Authorized access only
        </p>
      </div>

      <div className="flex items-center justify-center px-6 py-16 sm:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex min-h-11 items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/55 transition-colors hover:text-black">
            <ArrowLeft size={15} strokeWidth={1.25} aria-hidden="true" />
            Back to site
          </Link>
          <div className="mb-12 lg:hidden">
            <p className="font-serif text-2xl uppercase tracking-[0.16em]">Maru by Maru</p>
          </div>
          <p className="mb-3 text-[10px] uppercase tracking-[0.28em] text-black/45">
            Administration
          </p>
          <h1 className="font-serif text-5xl">Welcome back</h1>
          <p className="mt-4 text-sm leading-relaxed text-black/55">
            Sign in with the administrator account configured in Supabase.
          </p>

          <form onSubmit={handleSubmit} className="mt-12 space-y-7">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-[10px] uppercase tracking-[0.22em]">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border-0 border-b border-black bg-transparent px-0 py-3 text-sm outline-none placeholder:text-black/30 focus:ring-0"
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-[10px] uppercase tracking-[0.22em]">
                Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full border-0 border-b border-black bg-transparent px-0 py-3 pr-10 text-sm outline-none focus:ring-0"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 p-2"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="border border-black px-4 py-3 text-xs leading-relaxed">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="flex w-full items-center justify-center gap-3 bg-black px-6 py-4 text-xs uppercase tracking-[0.25em] text-white transition-opacity hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {isSubmitting && <Loader2 size={15} className="animate-spin" />}
              {isSubmitting ? "Signing in" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
