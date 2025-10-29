# WARP.md - Next.js Version

This file provides guidance to WARP (warp.dev) when working with the Next.js version of this repository.

## Project Overview

Document paraphrasing service rebuilt as a Next.js 14 application using OpenRouter API. Deployable on Vercel without external dependencies (Redis/BullMQ removed).

## Essential Commands

### Development
```bash
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production
npm start            # Run production build
npm run lint         # Run Next.js linter
```

### Deployment
```bash
vercel               # Deploy to Vercel (requires CLI)
git push origin main # Auto-deploy if connected to Vercel
```

## Architecture (Next.js Version)

### Key Changes from Express Version
- **No Redis/BullMQ**: Replaced with streaming responses
- **No file uploads folder**: Files processed in-memory from FormData
- **No background workers**: Direct processing in API route with streaming
- **Serverless-first**: Designed for Vercel's 5-minute function limit

### Request Flow
1. **Upload** → Client sends FormData with file to `/api/paraphrase`
2. **Extract** → Buffer converted to text via DocumentExtractor
3. **Chunk** → TextChunker splits into 4000-char chunks
4. **Stream** → ParaphrasingEngine yields progress updates via AsyncGenerator
5. **Client** → Reads streaming response, updates UI in real-time

### Service Layer Pattern

**Core Libraries (lib/):**
- `openrouter.ts` - Direct fetch-based API client (no OpenAI SDK dependency)
- `engine.ts` - Streaming paraphrasing orchestrator (AsyncGenerator)
- `chunker.ts` - Text chunking with overlap (unchanged)
- `extractor.ts` - Document extraction from Buffer (pdf-parse, mammoth)

**API Routes (app/api/):**
- `/api/paraphrase/route.ts` - Main endpoint with streaming
  - `maxDuration: 300` (5 minutes for large docs)
  - Returns `ReadableStream` with JSON-per-line updates
- `/api/health/route.ts` - Health check

### Streaming Protocol

Response format (newline-delimited JSON):
```json
{"type":"progress","progress":25,"currentChunk":5,"totalChunks":20}
{"type":"progress","progress":50,"currentChunk":10,"totalChunks":20}
{"type":"complete","result":"Full paraphrased text..."}
```

Error format:
```json
{"type":"error","error":"Error message"}
```

### Frontend (app/page.tsx)

Single-page React component with:
- File upload (PDF/DOCX/TXT validation)
- Configuration form (tone, formality, creativity)
- Progress bar with chunk counter
- Result preview with download button
- Uses `fetch` with `ReadableStream` reader for progress updates

## File Structure

```
nextjs-src/
├── app/
│   ├── api/
│   │   ├── paraphrase/route.ts    # Streaming paraphrase endpoint
│   │   └── health/route.ts        # Health check
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Main UI component
│   └── globals.css                # Tailwind directives
├── lib/
│   ├── types.ts                   # Shared TypeScript interfaces
│   ├── openrouter.ts              # OpenRouter API client (fetch-based)
│   ├── engine.ts                  # Paraphrasing engine (AsyncGenerator)
│   ├── chunker.ts                 # Text chunking utility
│   └── extractor.ts               # Document text extraction
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
└── vercel.json                    # Vercel function config
```

## Environment Variables

Required:
- `OPENROUTER_API_KEY` - Must be set in Vercel dashboard or `.env.local`

## Vercel Deployment

### First-time Setup
```bash
npm i -g vercel
vercel login
vercel
# Follow prompts, add OPENROUTER_API_KEY when asked
```

### Subsequent Deploys
- Push to GitHub (if connected) → auto-deploy
- Or run `vercel` in project directory

### Vercel Configuration (vercel.json)
```json
{
  "functions": {
    "app/api/paraphrase/route.ts": {
      "maxDuration": 300
    }
  }
}
```

## Known Limitations

- **Timeout**: 5-minute max (Vercel Pro allows 15 minutes)
- **Memory**: 1GB default (may fail on extremely large PDFs)
- **Output**: Always TXT format
- **Concurrency**: No queue—each request processes independently
- **State**: No job persistence (refresh = lost progress)

## Prompt Engineering

Same as Express version—see `lib/openrouter.ts`:
- System prompt in `buildSystemPrompt()`
- Tone/formality/creativity mappings unchanged
- Temperature: 0.3 (conservative), 0.6 (moderate), 0.9 (creative)

## Chunking & Overlap

Same logic as Express version—see `lib/chunker.ts`:
- 4000 char max, 200 char overlap
- Sentence-boundary splitting when possible
- Overlap removal in `engine.ts` via last 3 sentences comparison

## Debugging

### Local Development
```bash
npm run dev
# Check browser console for streaming updates
# Check terminal for server-side logs
```

### Vercel Logs
```bash
vercel logs <deployment-url>
```

Or view in Vercel Dashboard → Deployments → Logs

## When Modifying

- **Paraphrasing logic**: Edit `lib/engine.ts` and `lib/openrouter.ts`
- **UI**: Edit `app/page.tsx`
- **API behavior**: Edit `app/api/paraphrase/route.ts`
- **Styling**: Tailwind classes in components or `app/globals.css`

## Migration Notes

If migrating back to Express/BullMQ:
- Core logic (engine, chunker, extractor, openrouter) is identical
- Just restore worker pattern from `src/workers/paraphrasingWorker.ts`
- Replace streaming with job status polling
