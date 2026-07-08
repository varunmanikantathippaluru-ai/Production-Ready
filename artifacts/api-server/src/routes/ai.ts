import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { getGeminiModel, buildFeaturePrompt } from "../lib/gemini.js";
import { extractText } from "../lib/textExtractor.js";
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

    // Fetch document including storage_path and content
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("id, name, content, storage_path, file_size")
      .eq("id", documentId)
      .eq("user_id", userId)
      .single();

    if (docError || !doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    const docName = (doc as Record<string, unknown>)["name"] as string || "document";
    let docContent = (doc as Record<string, unknown>)["content"] as string || "";

    // Auto-heal: if content is empty (uploaded before text-extraction fix),
    // download the file from storage, re-extract, and persist to DB.
    if (!docContent.trim()) {
      const storagePath = (doc as Record<string, unknown>)["storage_path"] as string | null;
      if (storagePath) {
        req.log.info({ documentId, storagePath }, "Content empty — re-extracting from storage");
        try {
          const { data: fileData, error: dlError } = await supabase.storage
            .from("documents")
            .download(storagePath);

          if (!dlError && fileData) {
            const ext = storagePath.split(".").pop()?.toLowerCase() ?? "";
            const mimeMap: Record<string, string> = {
              pdf: "application/pdf",
              docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
              txt: "text/plain",
              md: "text/plain",
            };
            const mimeType = mimeMap[ext] ?? "application/octet-stream";
            const arrayBuf = await fileData.arrayBuffer();
            const buffer = Buffer.from(arrayBuf);
            const extracted = await extractText(buffer, mimeType, storagePath);

            if (extracted.trim()) {
              docContent = extracted;
              // Persist so future requests don't need to re-extract
              await supabase
                .from("documents")
                .update({ content: extracted })
                .eq("id", documentId)
                .eq("user_id", userId);
              req.log.info({ documentId, chars: extracted.length }, "Re-extraction succeeded");
            }
          }
        } catch (reExtractErr) {
          req.log.error({ reExtractErr }, "Re-extraction failed");
        }
      }
    }

    if (!docContent.trim()) {
      res.status(422).json({
        error:
          "This document has no extractable text. " +
          "If it is a scanned PDF (image-only), AI features cannot be used. " +
          "Try re-uploading a text-based PDF or a DOCX file.",
      });
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
