import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AdminAuthContextValue {
  session: Session | null;
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  refreshAdminStatus: () => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextValue | undefined>(undefined);

async function getAdminStatus(session: Session | null) {
  if (!session) return false;
  const { data, error } = await supabase.rpc("is_admin");
  if (error) throw error;
  return data === true;
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const resolveSession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    try {
      setIsAdmin(await getAdminStatus(nextSession));
    } catch {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) void resolveSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) void resolveSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [resolveSession]);

  const refreshAdminStatus = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const nextIsAdmin = await getAdminStatus(data.session);
    setSession(data.session);
    setIsAdmin(nextIsAdmin);
    setIsLoading(false);
    return nextIsAdmin;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAdmin,
      isLoading,
      refreshAdminStatus,
      signOut,
    }),
    [session, isAdmin, isLoading, refreshAdminStatus, signOut],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

// The provider and its hook intentionally live together as one auth boundary.
// eslint-disable-next-line react-refresh/only-export-components
export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return context;
}
