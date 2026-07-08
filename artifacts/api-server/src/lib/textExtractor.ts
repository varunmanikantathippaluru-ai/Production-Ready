import { createRequire } from "node:module";

const _require = createRequire(import.meta.url);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pdfParse: (buffer: Buffer) => Promise<{ text: string }> = _require("pdf-parse");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mammoth: { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> } = _require("mammoth");

export async function extractText(buffer: Buffer, mimeType: string, filename: string): Promise<string> {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";

  // PDF
  if (mimeType === "application/pdf" || ext === "pdf") {
    try {
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch {
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
      return result.value || "";
    } catch {
      return "";
    }
  }

  // TXT / plain text
  if (mimeType.startsWith("text/") || ext === "txt" || ext === "md") {
    return buffer.toString("utf-8");
  }

  return "";
}
