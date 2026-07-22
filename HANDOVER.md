# Handover — presentation-ai fork (Vendox-Automation)

Continuity notes for picking this up in a fresh Claude Code conversation. Working directory: `C:\Users\User\Documents\GitHub\presentation-ai`.

## How we got here

User is building their own AI slide-generator platform and evaluated three GitHub repos: `tonyqinatcmu/SlideBot-AI`, `allweonedev/presentation-ai`, `Anionex/banana-slides`. Decision: **fork `presentation-ai`**, not build from scratch, and not `banana-slides` — reasoning:
- `banana-slides` is AGPL-3.0 (copyleft risk for commercial use) and architecturally image-model-native, which fights against real PPTX editability.
- `presentation-ai` is MIT, already outline/text-native with a real editor (Plate) and an existing (if imperfect) PPTX export pipeline via `pptxgenjs` + a DOM-scan converter (`src/components/presentation/export/domToPptxConverter.ts`) — not a flattened-image export. This aligns with the identified differentiator: **editable/structured export fidelity** is the one thing every competitor (including this repo's own roadmap) admits is broken, and it's the actual moat worth investing in.
- Forking saves the commodity scaffolding (auth, DB, editor, theming); the real work is fixing export fidelity, not rebuilding boilerplate.

Repo is already forked and remotes are set correctly:
- `origin` → `https://github.com/Vendox-Automation/presentation-ai.git` (their fork, push target)
- `upstream` → `https://github.com/allweonedev/presentation-ai.git` (sync source — `git fetch upstream` periodically)

## What's been done this session

### 1. Local database
- Postgres 16 running in Docker: container `presentation-ai-db`, port 5432, user/pass/db = `presentation`/`presentation`/`presentation_ai`, data in named volume `presentation-ai-pgdata` (survives restarts). Confirmed still running.
- Schema pushed via `pnpm db:push` — all 10 Prisma models exist (`User`, `Presentation`, `CustomTheme`, `FontPair`, `GeneratedImage`, etc. — see `prisma/schema.prisma`).
- `src/server/db.ts` already picks the plain `pg` driver (not Neon) whenever `NODE_ENV !== "production"`, so no code changes were needed for local dev.

### 2. Full migration to OpenRouter as the sole AI provider (text **and** image)
User's directive: "can only choose AI models available from openrouter regardless of the medium it generates." This was a large multi-file refactor, done and pushed in 4 commits:

- **`d56cd4f` feat(models):** text generation now goes exclusively through OpenRouter (`https://openrouter.ai/api/v1`, OpenAI-compatible). Rewrote `src/lib/model-picker.ts` (re-exported unchanged via `src/lib/modelPicker.ts`), rewrote `ModelPicker.tsx` to list curated OpenRouter slugs, deleted the now-dead Ollama/LM Studio local-model discovery (`src/hooks/presentation/useLocalModels.ts`, `src/app/api/presentation/local-models/route.ts`), updated `presentation-state.ts` and the three route handlers (`outline`, `generate`, `generate-image-slides`) plus `PresentationGenerationManager.tsx` to use a single `"openrouter"` provider literal instead of `"openai"|"ollama"|"lmstudio"`.
- **`11848d8` feat(image-gen):** added `src/lib/openrouter-image.ts` (wraps OpenRouter's `POST /api/v1/images`, confirmed against their docs — request `{model, prompt, aspect_ratio}`, response `data[0].b64_json` + `media_type`). Migrated all three live image-gen call sites off FAL (`generate-slide-image.ts`, `image-studio/generate.ts`, `image-studio/generate-infographic.ts`). Deleted the already-unused Together AI action (`src/app/_actions/image/generate.ts` — confirmed dead via grep before deleting). Updated `src/constants/image-models.ts` model catalog to OpenRouter-hosted Gemini/Nano Banana models (`google/gemini-2.5-flash-image`, `google/gemini-3.1-flash-image`, `google/gemini-3-pro-image`) + `openai/gpt-image-2`, since **FLUX is not currently available through OpenRouter's image API** (checked their model collection directly). Also fixed two hardcoded stale FAL model-slug defaults in `image-generation-model.tsx` and `GenerateImageSlidesButton.tsx` that `tsc` caught.
- **`c3506f3` chore(deps):** `src/env.js` now requires `OPENROUTER_API_KEY` and no longer references `OPENAI_API_KEY`/`TOGETHER_AI_API_KEY`/`FAL_API_KEY`. Removed `together-ai`, `@fal-ai/client`, `ollama-ai-provider` from `package.json` (confirmed unused first). Updated `.env.example`.
- **`9c40a58` docs(readme):** replaced the OpenAI/Together/FAL/Ollama setup section and the whole "Local Models Guide" with an OpenRouter setup section.

`pnpm exec tsc --noEmit` passes clean (0 errors) as of the last commit.

**Model slugs used were chosen from research (OpenRouter's published docs/model collection via web search), not independently verified against a live API call.** If any text or image model 404s once real usage starts, the fix is a one-line edit in `ModelPicker.tsx` (text) or `constants/image-models.ts` (image) — swap in a confirmed-working slug from https://openrouter.ai/models.

### 3. Git workflow — standing instruction
User wants every completed change proactively committed **and pushed** to `origin` from now on, using their own commit convention: `type(scope): description` — types `fix`/`feat`/`refactor`/`chore`/`docs`/`test`, imperative lowercase description, short module scope (matches their example table and this repo's existing history like `feat(presentation): ...`). Interpretation being used: commit after each finished logical unit of work, not after every single file edit. This preference is saved in the assistant's memory system (`feedback_auto_commit_presentation_ai.md`) so it persists across conversations — **the new conversation should already have this via memory, but flagging it here in case memory isn't loaded.**

## Outstanding / needs attention next

1. **`.env` currently has stale content** — at last check it had `DATABASE_URL=""`, `NEXTAUTH_URL=""`, and old `OPENAI_API_KEY`/`TOGETHER_AI_API_KEY` lines (no `OPENROUTER_API_KEY`). This appears to have been reset/reverted outside this session. Since `OPENROUTER_API_KEY` is now a **required** env var (`env.js`), the app will fail to boot until it's set. Needs:
   ```
   DATABASE_URL="postgresql://presentation:presentation@localhost:5432/presentation_ai"
   NEXTAUTH_URL="http://localhost:3000"
   OPENROUTER_API_KEY="<real key>"
   ```
   (`.env` is gitignored, so this was never in the commits — it's purely local machine state.)
2. **No end-to-end test yet with a real OpenRouter key.** Once `OPENROUTER_API_KEY` is set, run `pnpm dev` and actually generate a presentation (text) and a slide image to confirm the chosen model slugs work.
3. **`NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`** are still empty in `.env` — auth is required by `env.js` (non-optional), so sign-in won't work until a Google OAuth client is set up for local dev, or an alternative auth method is wired in.
4. **corepack is broken** in this environment (`EPERM` writing to `C:\Program Files\nodejs\yarn`) — worked around via `npm install -g pnpm@11.1.3` instead of `corepack enable`. Not fixed, just bypassed; could resurface on a fresh machine/reinstall.
5. **Original product-strategy thread** (why export fidelity is the differentiator, why not to chase "fixing every competitor's weakness") is background context for future roadmap decisions — see the "How we got here" section above for the short version; full reasoning is in the prior conversation if needed.

## Useful paths
- `src/lib/model-picker.ts` / `src/lib/openrouter-image.ts` — the two OpenRouter client entry points
- `src/constants/image-models.ts` — image model catalog (edit here to add/swap models)
- `src/components/notebook/presentation/components/ModelPicker.tsx` — text model catalog (edit here to add/swap models)
- `src/components/presentation/export/domToPptxConverter.ts` — the PPTX export path, likely the next real feature-work target per the original strategy discussion
