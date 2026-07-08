import { Router } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase.js";
import { extractText } from "../lib/textExtractor.js";
import { requireAuth, type AuthRequest } from "../middlewares/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req: unknown, file: { mimetype: string; originalname: string }, cb: (err: Error | null, accept: boolean) => void) => {
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    const allowedExt = ["pdf", "docx", "txt", "md"];
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "";
    if (allowed.includes(file.mimetype) || allowedExt.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF, DOCX, and TXT files are allowed"), false);
    }
  },
});

// GET /documents
router.get("/documents", requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { search, type, page = "1", limit = "20" } = req.query as Record<string, string>;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, parseInt(limit) || 20);
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) query = query.ilike("name", `%${search}%`);
    if (type) query = query.eq("file_type", type);

    const { data, error, count } = await query;
    if (error) throw error;

    const documents = (data || []).map(mapDocument);
    res.json({ documents, total: count || 0, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error({ err }, "listDocuments failed");
    res.status(500).json({ error: "Failed to list documents" });
  }
});

// POST /documents (multipart upload)
router.post("/documents", requireAuth, upload.single("file"), async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    type UploadedFile = { buffer: Buffer; originalname: string; mimetype: string; size: number };
    const file = (req as unknown as { file?: UploadedFile }).file;
    if (!file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }

    const name = (req.body.name as string) || file.originalname;
    const ext = file.originalname.split(".").pop()?.toLowerCase() ?? "bin";
    const docId = crypto.randomUUID();
    const storagePath = `${userId}/${docId}/${name}`;

    // Upload to Supabase Storage — auto-create the bucket on first use
    let { error: storageError } = await supabase.storage
      .from("documents")
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (storageError && (storageError.message?.includes("Bucket not found") || (storageError as unknown as Record<string, unknown>)["statusCode"] === "404")) {
      // Bucket doesn't exist yet — create it (private) and retry once
      const { error: bucketErr } = await supabase.storage.createBucket("documents", {
        public: false,
        fileSizeLimit: 52428800, // 50 MB
      });
      if (bucketErr && !bucketErr.message?.includes("already exists")) {
        throw bucketErr;
      }
      const retry = await supabase.storage
        .from("documents")
        .upload(storagePath, file.buffer, { contentType: file.mimetype, upsert: false });
      storageError = retry.error;
    }

    if (storageError) throw storageError;

    // Extract text content
    const content = await extractText(file.buffer, file.mimetype, file.originalname);

    // Insert document record
    const { data: doc, error: dbError } = await supabase
      .from("documents")
      .insert({
        id: docId,
        user_id: userId,
        name,
        file_type: ext.toUpperCase(),
        file_size: file.size,
        storage_path: storagePath,
        content,
        status: "ready",
        conversation_count: 0,
      })
      .select()
      .single();

    if (dbError) {
      // Clean up storage on DB failure
      await supabase.storage.from("documents").remove([storagePath]);
      throw dbError;
    }

    res.status(201).json(mapDocument(doc));
  } catch (err) {
    req.log.error({ err }, "uploadDocument failed");
    res.status(500).json({ error: "Failed to upload document" });
  }
});

// GET /documents/:id
router.get("/documents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    res.json(mapDocument(data));
  } catch (err) {
    req.log.error({ err }, "getDocument failed");
    res.status(500).json({ error: "Failed to get document" });
  }
});

// PATCH /documents/:id
router.patch("/documents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;
    const { name } = req.body;

    if (!name) {
      res.status(400).json({ error: "Name is required" });
      return;
    }

    const { data, error } = await supabase
      .from("documents")
      .update({ name, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    res.json(mapDocument(data));
  } catch (err) {
    req.log.error({ err }, "updateDocument failed");
    res.status(500).json({ error: "Failed to update document" });
  }
});

// DELETE /documents/:id
router.delete("/documents/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId!;

    const { data: doc } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (!doc) {
      res.status(404).json({ error: "Document not found" });
      return;
    }

    // Delete from storage
    if (doc.storage_path) {
      await supabase.storage.from("documents").remove([doc.storage_path]);
    }

    // Delete from DB (cascades to conversations + messages)
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) throw error;

    res.json({ success: true, message: "Document deleted" });
  } catch (err) {
    req.log.error({ err }, "deleteDocument failed");
    res.status(500).json({ error: "Failed to delete document" });
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

export default router;
