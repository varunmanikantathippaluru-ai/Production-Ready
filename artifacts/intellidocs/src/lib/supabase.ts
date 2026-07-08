import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// The client is stored on `window` so it survives Vite HMR module reloads.
// This guarantees exactly ONE GoTrueClient instance in the browser at all times —
// multiple instances break auth state listeners and cause "session not found" bugs.
declare global {
  interface Window {
    __intellidocs_sb__?: SupabaseClient;
  }
}

// Safe proxy: always reads from the single window-stored client.
// Throws clearly if accessed before initSupabase() has resolved.
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = window.__intellidocs_sb__;
    if (!client) {
      throw new Error(
        `Supabase client accessed before initSupabase() resolved (property: ${String(prop)})`
      );
    }
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof val === 'function'
      ? (val as (...args: unknown[]) => unknown).bind(client)
      : val;
  },
});

let _initPromise: Promise<void> | null = null;

export async function initSupabase(): Promise<void> {
  // Already initialized (e.g. survived HMR reload) — reuse existing client
  if (window.__intellidocs_sb__) return;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const res = await fetch('/api/config');
    if (!res.ok) {
      throw new Error(
        `Failed to fetch Supabase configuration from server (${res.status}). ` +
        'Make sure the API server is running and SUPABASE_URL / SUPABASE_ANON_KEY are set as Replit Secrets.'
      );
    }

    const data = await res.json() as { supabaseUrl?: string; supabaseAnonKey?: string; error?: string };

    if (data.error || !data.supabaseUrl || !data.supabaseAnonKey) {
      throw new Error(
        data.error ??
        'SUPABASE_URL and SUPABASE_ANON_KEY must be set as Replit Secrets. ' +
        'The value of SUPABASE_URL should be your project URL only, e.g. https://xxx.supabase.co'
      );
    }

    window.__intellidocs_sb__ = createClient(data.supabaseUrl, data.supabaseAnonKey, {
      auth: {
        detectSessionInUrl: true,   // process ?code= and #access_token= from OAuth redirects
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  })();

  return _initPromise;
}
