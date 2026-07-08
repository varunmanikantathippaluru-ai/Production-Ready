import { Router } from "express";

const router = Router();

// Public endpoint — returns frontend-safe Supabase config.
// The anon key is intentionally public; it is designed to be exposed to browsers.
// We sanitize the URL here to handle common misconfiguration (e.g. user copies /rest/v1 URL).
router.get("/config", (_req, res) => {
  const rawUrl = process.env["SUPABASE_URL"] ?? "";

  // Strip accidental path suffixes — the project URL must be bare: https://xxx.supabase.co
  const supabaseUrl = rawUrl
    .replace(/\/+$/, "")          // trailing slashes
    .replace(/\/rest\/v1$/, "")   // copied from REST API URL
    .replace(/\/auth\/v1$/, "");  // copied from Auth URL

  const supabaseAnonKey = process.env["SUPABASE_ANON_KEY"] ?? "";

  if (!supabaseUrl || !supabaseAnonKey) {
    res.status(500).json({
      error:
        "Supabase configuration is not set on the server. " +
        "Add SUPABASE_URL and SUPABASE_ANON_KEY as Replit Secrets, then restart the API server workflow.",
    });
    return;
  }

  res.json({ supabaseUrl, supabaseAnonKey });
});

export default router;
