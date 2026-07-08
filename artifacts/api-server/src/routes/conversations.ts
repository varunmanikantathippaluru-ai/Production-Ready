import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// GET /conversations
router.get("/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { documentId, search, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from("conversations")
      .select("*, documents(name)", { count: "exact" })
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (documentId) query = query.eq("document_id", documentId);
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    const conversations = (data || []).map(mapConversation);
    res.json({ conversations, total: count || 0, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "listConversations failed");
    res.status(500).json({ error: "Failed to list conversations" });
  }
});

// POST /conversations
router.post("/conversations", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { documentId, title } = req.body;

    if (!documentId) {
      res.status(400).json({ error: "documentId is required" });
      return;
    }

    // Verify document belongs to user
    const { data: doc } = await supabase
      .from("documents")
      .select("id, name")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        document_id: documentId,
        title: title || `Chat with ${(doc as { name: string }).name}`,
        message_count: 0,
      })
      .select("*, documents(name)")
      .single();

    if (error) throw error;

    // Increment document conversation count (best effort)
    try {
      await supabase.rpc("increment_conversation_count", { doc_id: documentId });
    } catch { /* ignore */ }

    res.status(201).json(mapConversation(data));
  } catch (err) {
    req.log.error({ err }, "createConversation failed");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

// GET /conversations/:id
router.get("/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: conv, error } = await supabase
      .from("conversations")
      .select("*, documents(name)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    const result = {
      ...mapConversation(conv),
      messages: (messages || []).map(mapMessage),
    };
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "getConversation failed");
    res.status(500).json({ error: "Failed to get conversation" });
  }
});

// PATCH /conversations/:id
router.patch("/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { title } = req.body;

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .update({ title, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select("*, documents(name)")
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    res.json(mapConversation(data));
  } catch (err) {
    req.log.error({ err }, "updateConversation failed");
    res.status(500).json({ error: "Failed to update conversation" });
  }
});

// DELETE /conversations/:id
router.delete("/conversations/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { error } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res.json({ success: true, message: "Conversation deleted" });
  } catch (err) {
    req.log.error({ err }, "deleteConversation failed");
    res.status(500).json({ error: "Failed to delete conversation" });
  }
});

// POST /conversations/:id/chat
router.post("/conversations/:id/chat", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { content } = req.body;

    if (!content) {
      res.status(400).json({ error: "content is required" });
      return;
    }

    // Get conversation + document
    const { data: conv } = await supabase
      .from("conversations")
      .select("*, documents(id, name, content)")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    // Get recent message history (last 20)
    const { data: history } = await supabase
      .from("messages")
      .select("role, content")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(20);

    // Save user message
    const { data: userMsg, error: userMsgError } = await supabase
      .from("messages")
      .insert({ conversation_id: id, role: "user", content })
      .select()
      .single();

    if (userMsgError) throw userMsgError;

    // Build Gemini request
    const { getGeminiModel, buildDocumentSystemPrompt } = await import("../lib/gemini.js");
    const model = getGeminiModel();
    const doc = (conv as Record<string, unknown>)["documents"] as Record<string, unknown>;
    const docContent = (doc?.["content"] as string) || "";
    const docName = (doc?.["name"] as string) || "document";
    const systemPrompt = buildDocumentSystemPrompt(docContent, docName);

    const chatHistory = ((history || []) as Array<{ role: string; content: string }>).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: systemPrompt }] },
        { role: "model", parts: [{ text: "I understand. I will answer questions strictly based on the provided document content." }] },
        ...chatHistory,
      ],
    });

    const result = await chat.sendMessage(content);
    const aiText = result.response.text();

    // Save assistant message
    const { data: aiMsg, error: aiMsgError } = await supabase
      .from("messages")
      .insert({ conversation_id: id, role: "assistant", content: aiText })
      .select()
      .single();

    if (aiMsgError) throw aiMsgError;

    // Update conversation updated_at + message count
    const { count: msgCount } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", id);

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString(), message_count: msgCount ?? 0 })
      .eq("id", id);

    res.json({
      userMessage: mapMessage(userMsg),
      assistantMessage: mapMessage(aiMsg),
    });
  } catch (err) {
    req.log.error({ err }, "sendMessage failed");
    res.status(500).json({ error: "Failed to send message" });
  }
});

// DELETE /conversations/:id/messages/:messageId
router.delete("/conversations/:id/messages/:messageId", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id, messageId } = req.params;
    const userId = req.userId!;

    // Verify conversation ownership
    const { data: conv } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const { error } = await supabase
      .from("messages")
      .delete()
      .eq("id", messageId)
      .eq("conversation_id", id);

    if (error) throw error;

    res.json({ success: true, message: "Message deleted" });
  } catch (err) {
    req.log.error({ err }, "deleteMessage failed");
    res.status(500).json({ error: "Failed to delete message" });
  }
});

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

function mapMessage(msg: Record<string, unknown>) {
  return {
    id: msg["id"],
    conversationId: msg["conversation_id"],
    role: msg["role"],
    content: msg["content"],
    createdAt: msg["created_at"],
  };
}

export default router;
