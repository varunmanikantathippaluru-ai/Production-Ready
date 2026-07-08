import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getGeminiModel, buildFeaturePrompt } from "../lib/gemini.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();

// POST /ai/generate
router.post("/ai/generate", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { documentId, featureType, additionalContext } = req.body;

    if (!documentId || !featureType) {
      res.status(400).json({ error: "documentId and featureType are required" });
      return;
    }

    // Get document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, name, content")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (docError || !doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const docContent = (doc as Record<string, unknown>)["content"] as string || "";
    const docName = (doc as Record<string, unknown>)["name"] as string || "document";

    if (!docContent) {
      res.status(422).json({ error: "Document content could not be extracted. Please ensure the file is readable." });
      return;
    }

    const prompt = buildFeaturePrompt(featureType, docContent, docName, additionalContext);
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    res.json({ featureType, content, documentId });
  } catch (err) {
    req.log.error({ err }, "generateAiContent failed");
    res.status(500).json({ error: "Failed to generate AI content" });
  }
});

export default router;
