import { useEffect } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

/**
 * OAuth callback page.
 * Supabase redirects here after Google authentication with ?code=...
 * The SDK automatically exchanges the code for a session via detectSessionInUrl.
 * We just wait for the auth state to settle, then forward to /dashboard.
 */
export default function AuthCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Listen for the SIGNED_IN event that fires once the code is exchanged
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        subscription.unsubscribe();
        setLocation("/dashboard");
      } else if (event === "SIGNED_OUT" || (!session && event !== "INITIAL_SESSION")) {
        subscription.unsubscribe();
        setLocation("/login");
      }
    });

    // Also check immediately — the session might already be set by the time we mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        subscription.unsubscribe();
        setLocation("/dashboard");
      }
    });

    // Fallback timeout: if nothing happens in 10s, send to login
    const timeout = setTimeout(() => {
      subscription.unsubscribe();
      setLocation("/login");
    }, 10000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [setLocation]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">Completing sign-in…</p>
    </div>
  );
}
