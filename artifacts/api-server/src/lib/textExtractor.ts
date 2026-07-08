import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);

// pdf-parse v2 exports a class-based API — NOT a callable function (v1 behaviour).
// Constructor: new PDFParse({ data: Buffer }) — Buffer is auto-cast to Uint8Array internally.
// Text extraction: await parser.getText() → { text: string, ... }
const { PDFParse } = _require("pdf-parse") as {
  PDFParse: new (opts: { data: Buffer; verbosity?: number }) => {
    getText: () => Promise<{ text: string }>;
  };
};

// mammoth v1 API is unchanged.
const mammoth = _require("mammoth") as {
  extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }>;
};

export async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  // PDF — use pdf-parse v2 class API
  if (mimeType === "application/pdf" || ext === "pdf") {
    try {
      const parser = new PDFParse({ data: buffer, verbosity: 0 });
      const result = await parser.getText();
      return result.text?.trim() || "";
    } catch (err) {
      console.error("[textExtractor] PDF extraction failed:", (err as Error).message);
      return "";
    }
  }

  // DOCX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value?.trim() || "";
    } catch (err) {
      console.error("[textExtractor] DOCX extraction failed:", (err as Error).message);
      return "";
    }
  }

  // Plain text / markdown
  if (mimeType.startsWith("text/") || ext === "txt" || ext === "md") {
    return buffer.toString("utf-8").trim();
  }

  console.warn("[textExtractor] Unsupported file type:", mimeType, filename);
  return "";
}
