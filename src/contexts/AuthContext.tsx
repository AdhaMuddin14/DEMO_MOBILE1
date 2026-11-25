import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";

import { supabase } from "../lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authError: string | null;
  realtimeStatus: "connecting" | "connected" | "disconnected";
  realtimeRevision: number;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("disconnected");
  const [realtimeRevision, setRealtimeRevision] = useState(0);

  useEffect(() => {
    let mounted = true;
    let receivedAuthEvent = false;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      receivedAuthEvent = true;
      if (mounted) {
        setRealtimeStatus(nextSession ? "connecting" : "disconnected");
        setRealtimeRevision((current) => (nextSession ? current : 0));
        setSession(nextSession);
        setAuthError(null);
        setLoading(false);
      }
    });

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (!mounted || receivedAuthEvent) return;
        if (error) {
          setSession(null);
          setRealtimeStatus("disconnected");
          setRealtimeRevision(0);
          setAuthError(error.message);
        } else {
          setRealtimeStatus(data.session ? "connecting" : "disconnected");
          setRealtimeRevision(0);
          setSession(data.session);
        }
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted || receivedAuthEvent) return;
        setSession(null);
        setRealtimeStatus("disconnected");
        setRealtimeRevision(0);
        setAuthError(
          error instanceof Error ? error.message : "Gagal memulihkan sesi autentikasi.",
        );
        setLoading(false);
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const userId = session?.user.id;
    if (!userId) {
      return;
    }

    let mounted = true;

    const channel = supabase
      .channel(`library_tasks:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "library_tasks",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          if (mounted) {
            setRealtimeRevision((current) => current + 1);
          }
        },
      )
      .subscribe((status) => {
        if (!mounted) return;
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("connected");
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setRealtimeStatus("disconnected");
        } else if (status === "CLOSED") {
          setRealtimeStatus("disconnected");
        }
      });

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        authError,
        realtimeStatus,
        realtimeRevision,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider.");
  }
  return context;
}
