import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /dashboard/stats
router.get("/dashboard/stats", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [docsResult, convsResult, msgsResult] = await Promise.all([
      supabase.from("documents").select("id, file_size", { count: "exact" }).eq("user_id", userId),
      supabase.from("conversations").select("id", { count: "exact" }).eq("user_id", userId),
      supabase
        .from("messages")
        .select("id", { count: "exact" })
        .in(
          "conversation_id",
          await supabase
            .from("conversations")
            .select("id")
            .eq("user_id", userId)
            .then((r) => (r.data || []).map((c: Record<string, unknown>) => c["id"])),
        ),
    ]);

    const storageUsedBytes = (docsResult.data || []).reduce(
      (sum: number, d: Record<string, unknown>) => sum + ((d["file_size"] as number) || 0),
      0,
    );

    // Recent documents
    const { data: recentDocs } = await supabase
      .from("documents")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    // Recent conversations
    const { data: recentConvs } = await supabase
      .from("conversations")
      .select("*, documents(name)")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(5);

    res.json({
      totalDocuments: docsResult.count || 0,
      totalConversations: convsResult.count || 0,
      totalMessages: msgsResult.count || 0,
      storageUsedBytes,
      storageUsedMb: Math.round((storageUsedBytes / 1024 / 1024) * 100) / 100,
      recentDocuments: (recentDocs || []).map(mapDocument),
      recentConversations: (recentConvs || []).map(mapConversation),
    });
  } catch (err) {
    req.log.error({ err }, "getDashboardStats failed");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

// GET /dashboard/recent-activity
router.get("/dashboard/recent-activity", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    const [docsResult, convsResult] = await Promise.all([
      supabase
        .from("documents")
        .select("id, name, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("conversations")
        .select("id, title, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    const docItems = (docsResult.data || []).map((d: Record<string, unknown>) => ({
      id: `doc-${d["id"]}`,
      type: "document_uploaded",
      description: `Uploaded "${d["name"]}"`,
      resourceId: d["id"] as string,
      resourceName: d["name"] as string,
      createdAt: d["created_at"],
    }));

    const convItems = (convsResult.data || []).map((c: Record<string, unknown>) => ({
      id: `conv-${c["id"]}`,
      type: "conversation_started",
      description: `Started conversation "${c["title"]}"`,
      resourceId: c["id"] as string,
      resourceName: c["title"] as string,
      createdAt: c["created_at"],
    }));

    const items = [...docItems, ...convItems]
      .sort((a, b) => new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime())
      .slice(0, 20);

    res.json({ items });
  } catch (err) {
    req.log.error({ err }, "getRecentActivity failed");
    res.status(500).json({ error: "Failed to get recent activity" });
  }
});

function mapDocument(doc: Record<string, unknown>) {
  return {
    id: doc["id"],
    userId: doc["user_id"],
    name: doc["name"],
    fileType: doc["file_type"],
    fileSize: doc["file_size"],
    storagePath: doc["storage_path"],
    publicUrl: null,
    pageCount: doc["page_count"] ?? null,
    status: doc["status"] ?? "ready",
    conversationCount: doc["conversation_count"] ?? 0,
    createdAt: doc["created_at"],
    updatedAt: doc["updated_at"],
  };
}

function mapConversation(conv: Record<string, unknown>) {
  const docs = conv["documents"] as Record<string, unknown> | null;
  return {
    id: conv["id"],
    userId: conv["user_id"],
    documentId: conv["document_id"],
    documentName: docs?.["name"] ?? null,
    title: conv["title"],
    messageCount: conv["message_count"] ?? 0,
    createdAt: conv["created_at"],
    updatedAt: conv["updated_at"],
  };
}

export default router;
