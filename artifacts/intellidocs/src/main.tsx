import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';
import { initSupabase, supabase } from '@/lib/supabase';
import App from './App.tsx';
import './index.css';

// Inject Supabase Auth token into all generated API hooks
setAuthTokenGetter(async () => {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token ?? null;
});

async function boot() {
  try {
    await initSupabase();
  } catch (err: unknown) {
    document.getElementById('root')!.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#0a0a0f;color:#fff;font-family:sans-serif;padding:2rem;text-align:center;">
        <div>
          <h2 style="color:#f87171;margin-bottom:1rem;">Configuration Error</h2>
          <p style="color:#94a3b8;max-width:480px;">${(err as Error).message}</p>
          <p style="color:#64748b;font-size:0.875rem;margin-top:1rem;">
            Make sure SUPABASE_URL and SUPABASE_ANON_KEY are set as Replit Secrets,
            then restart the API server workflow.
          </p>
        </div>
      </div>`;
    return;
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

boot();
