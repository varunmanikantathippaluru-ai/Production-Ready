import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /profile
router.get("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !data) {
      // Create a minimal profile if it doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: userId,
          email: req.userEmail || "",
          dark_mode: false,
          email_notifications: true,
          preferred_language: "en",
        })
        .select()
        .single();

      if (createError) throw createError;
      res.json(mapProfile(newProfile));
      return;
    }

    res.json(mapProfile(data));
  } catch (err) {
    req.log.error({ err }, "getProfile failed");
    res.status(500).json({ error: "Failed to get profile" });
  }
});

// PATCH /profile
router.patch("/profile", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { fullName, preferredLanguage, darkMode, emailNotifications } = req.body;

    const updates: Record<string, unknown> = {};
    if (fullName !== undefined) updates["full_name"] = fullName;
    if (preferredLanguage !== undefined) updates["preferred_language"] = preferredLanguage;
    if (darkMode !== undefined) updates["dark_mode"] = darkMode;
    if (emailNotifications !== undefined) updates["email_notifications"] = emailNotifications;

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    res.json(mapProfile(data));
  } catch (err) {
    req.log.error({ err }, "updateProfile failed");
    res.status(500).json({ error: "Failed to update profile" });
  }
});

// DELETE /profile/delete-account
router.delete("/profile/delete-account", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Delete all user data (cascades from profiles/documents)
    await supabase.from("profiles").delete().eq("id", userId);

    // Get and delete all storage files
    const { data: docs } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("user_id", userId);

    if (docs && docs.length > 0) {
      const paths = (docs as Array<{ storage_path: string }>)
        .map((d) => d.storage_path)
        .filter(Boolean);
      if (paths.length) await supabase.storage.from("documents").remove(paths);
    }

    // Delete the auth user
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) throw error;

    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    req.log.error({ err }, "deleteAccount failed");
    res.status(500).json({ error: "Failed to delete account" });
  }
});

function mapProfile(profile: Record<string, unknown>) {
  return {
    id: profile["id"],
    email: profile["email"],
    fullName: profile["full_name"] ?? null,
    avatarUrl: profile["avatar_url"] ?? null,
    preferredLanguage: profile["preferred_language"] ?? "en",
    darkMode: profile["dark_mode"] ?? false,
    emailNotifications: profile["email_notifications"] ?? true,
    createdAt: profile["created_at"],
  };
}

export default router;
