---
name: IntelliDocs Supabase + build setup
description: Key decisions for IntelliDocs AI — Supabase auth/DB/storage, Vite env injection, esbuild externals, text extraction.
---

# IntelliDocs AI — Durable Build & Integration Notes

## Supabase frontend env vars
Frontend needs VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. These are injected via `define` in `artifacts/intellidocs/vite.config.ts` reading from `process.env.SUPABASE_URL` and `process.env.SUPABASE_ANON_KEY` (which are Replit secrets). No separate VITE_ secrets needed.

**Why:** Secrets are not accessible with the VITE_ prefix by default; the define trick reads them server-side at dev/build time and injects them into the bundle.

## Auth token injection
`setAuthTokenGetter` from `@workspace/api-client-react` is called in `src/main.tsx` (or App.tsx) with a function that gets the current Supabase session access token. This auto-injects the Bearer token into all generated Orval API hooks.

## pdf-parse and mammoth
Both are externalized from esbuild bundle in `artifacts/api-server/build.mjs` (added to `external` array). They are loaded via `createRequire` in `src/lib/textExtractor.ts` to avoid ESM/CJS compatibility issues.

**Why:** pdf-parse v2 ESM build has no default export; mammoth is CJS-only. Externalizing + createRequire is the clean solution.

## Database schema
SQL schema is in SUPABASE_SETUP.md. Tables: profiles, documents, conversations, messages. Backend uses service role key (bypasses RLS). Security enforced at API layer via JWT verification before every operation.

## Supabase storage
Private bucket named `documents`. Path: `{userId}/{documentId}/{filename}`. All access through backend using service role key.

## Text extraction timing
Document text is extracted at upload time (pdf-parse for PDF, mammoth for DOCX, buffer.toString for TXT) and stored in `documents.content` column. AI chat retrieves this content without re-downloading the file.
