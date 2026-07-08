---
name: pdf-parse v2 API change
description: pdf-parse v2 changed from a callable function to a class-based API — breaking text extraction silently.
---

## Rule

`pdf-parse` v2 exports a **class** `PDFParse`, not a callable function. Calling it as `pdfParse(buffer)` (v1 style) throws silently (caught by the try/catch) and returns `""`.

**Correct v2 usage:**
```ts
const { PDFParse } = _require("pdf-parse");
const parser = new PDFParse({ data: buffer, verbosity: 0 });
const result = await parser.getText();
return result.text?.trim() || "";
```

The constructor accepts `{ data: Buffer }` — it auto-converts to `Uint8Array` internally. No separate `load()` call is needed before `getText()`.

**Why:** pdf-parse went from a thin wrapper around pdfjs-dist in v1 to a full class-based API in v2 (different npm package maintainer/fork). The breaking change is not flagged in the npm README prominently.

**How to apply:** Any time pdf-parse is required via `createRequire` in the API server's textExtractor, verify the import destructures `PDFParse` and uses the class pattern above. Do NOT write `const pdfParse = _require("pdf-parse"); pdfParse(buffer)`.
