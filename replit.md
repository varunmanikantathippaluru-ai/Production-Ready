# IntelliDocs AI

An AI-powered document knowledge assistant. Upload PDFs, DOCX, and TXT files, then chat with them or generate summaries, flashcards, quizzes, and more using Google Gemini AI.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/intellidocs run dev` — run the frontend (auto-started by workflow)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Required Secrets

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key (frontend)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (backend, bypasses RLS)
- `GEMINI_API_KEY` — Google Gemini API key

## Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, wouter, TanStack Query, Framer Motion, @supabase/supabase-js, react-markdown
- **Backend**: Node.js, Express 5, @supabase/supabase-js, @google/generative-ai, multer, pdf-parse, mammoth
- **Auth**: Supabase Auth (email/password + Google OAuth)
- **Database**: Supabase PostgreSQL with Row Level Security
- **Storage**: Supabase Storage (private `documents` bucket)
- **AI**: Google Gemini 1.5 Flash
- **API codegen**: Orval (from OpenAPI spec)

## Setup

**See `SUPABASE_SETUP.md` for the full Supabase SQL schema setup guide.**

Key steps:
1. Create Supabase project and run SQL from `SUPABASE_SETUP.md`
2. Create a private Storage bucket named `documents`
3. Enable Email and Google OAuth providers in Supabase Auth
4. Secrets are already configured via Replit

## Where things live

- `lib/api-spec/openapi.yaml` — API contract (source of truth)
- `lib/api-client-react/src/generated/` — Generated React Query hooks (don't edit)
- `lib/api-zod/src/generated/` — Generated Zod schemas (don't edit)
- `artifacts/api-server/src/routes/` — Express route handlers
- `artifacts/api-server/src/lib/` — Supabase client, Gemini client, text extractor
- `artifacts/api-server/src/middlewares/auth.ts` — Supabase JWT verification
- `artifacts/intellidocs/src/pages/` — All app pages
- `artifacts/intellidocs/src/contexts/AuthContext.tsx` — Auth state management
- `artifacts/intellidocs/src/lib/supabase.ts` — Frontend Supabase client

## Architecture decisions

- Backend uses Supabase service role key (bypasses RLS); security enforced at API layer by verifying JWT before every operation
- Vite `define` config injects `SUPABASE_URL`/`SUPABASE_ANON_KEY` from secrets at build time (no VITE_ env var setup needed)
- `setAuthTokenGetter` from `@workspace/api-client-react` injects Supabase JWT into all generated API hooks automatically
- Text extraction happens at upload time; content stored in `documents.content` column for AI chat context
- pdf-parse and mammoth are externalized from esbuild bundle (CJS packages, loaded via require at runtime)

## Gotchas

- After any OpenAPI spec change, run codegen before using updated types: `pnpm --filter @workspace/api-spec run codegen`
- The `documents` storage bucket must be **private** — backend handles all file access via service role key
- Google OAuth redirect URL must be configured in Supabase dashboard + Google Cloud Console

## User preferences

_Populate as preferences are stated._

## Pointers

- See `SUPABASE_SETUP.md` for database schema and storage setup
- See `pnpm-workspace` skill for monorepo structure details
